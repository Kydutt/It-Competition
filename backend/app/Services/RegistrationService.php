<?php

namespace App\Services;

use App\Enums\CompetitionStatus;
use App\Enums\DocumentVerificationStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Models\Competition;
use App\Models\Event;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class RegistrationService
{
    /**
     * Create a draft registration for individual participant or team.
     */
    public function createDraft(User $user, Competition $competition, array $data = []): Registration
    {
        // 1. Verify competition registration status
        if ($competition->status !== CompetitionStatus::REGISTRATION_OPEN) {
            throw ValidationException::withMessages([
                'competition' => ['Pendaftaran untuk kompetisi ini tidak sedang dibuka.'],
            ]);
        }

        // 2. Verify registration window
        if (now()->isBefore($competition->registration_start) || now()->isAfter($competition->registration_deadline)) {
            throw ValidationException::withMessages([
                'competition' => ['Masa pendaftaran kompetisi ini telah berakhir atau belum dimulai.'],
            ]);
        }

        $maxAttempts = 5;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            $attempt++;

            try {
                return DB::transaction(function () use ($user, $competition, $data) {
                    // Lock parent Event if present to coordinate concurrent registration across competitions in the event
                    if ($competition->event_id && DB::connection()->getDriverName() !== 'sqlite') {
                        Event::where('id', $competition->event_id)->lockForUpdate()->first();
                    }

                    $isTeam = $competition->registration_type === RegistrationType::TEAM;
                    $teamId = null;
                    $participantId = null;

                    if ($isTeam) {
                        if (empty($data['team_id'])) {
                            throw ValidationException::withMessages([
                                'team_id' => ['Kompetisi ini beregu. Anda wajib memilih atau membuat tim.'],
                            ]);
                        }

                        $team = Team::with('members')->findOrFail($data['team_id']);

                        // Ensure the user is the leader of the team
                        if ($team->leader_id !== $user->id) {
                            throw ValidationException::withMessages([
                                'team_id' => ['Hanya ketua tim yang dapat mendaftarkan tim ke kompetisi.'],
                            ]);
                        }

                        // Count total members (leader + members)
                        $memberCount = $team->members()->count();
                        if ($memberCount < $competition->min_members || $memberCount > $competition->max_members) {
                            throw ValidationException::withMessages([
                                'team_id' => [
                                    "Jumlah anggota tim ({$memberCount}) tidak memenuhi batas kompetisi: minimal {$competition->min_members} dan maksimal {$competition->max_members} orang."
                                ],
                            ]);
                        }

                        // Check duplicate active registration for the team in this competition
                        $dupQuery = Registration::where('competition_id', $competition->id)
                            ->where('team_id', $team->id)
                            ->whereNotIn('status', [RegistrationStatus::CANCELLED]);

                        if (DB::connection()->getDriverName() !== 'sqlite') {
                            $dupQuery->lockForUpdate();
                        }

                        if ($dupQuery->exists()) {
                            throw ValidationException::withMessages([
                                'team_id' => ['Tim ini sudah memiliki pendaftaran aktif pada cabang kompetisi ini.'],
                            ]);
                        }

                        $teamId = $team->id;
                    } else {
                        // Individual registration
                        $dupQuery = Registration::where('competition_id', $competition->id)
                            ->where('participant_id', $user->id)
                            ->whereNotIn('status', [RegistrationStatus::CANCELLED]);

                        if (DB::connection()->getDriverName() !== 'sqlite') {
                            $dupQuery->lockForUpdate();
                        }

                        if ($dupQuery->exists()) {
                            throw ValidationException::withMessages([
                                'participant_id' => ['Anda sudah terdaftar pada cabang kompetisi ini.'],
                            ]);
                        }

                        $participantId = $user->id;
                    }

                    $registrationNumber = $this->generateRegistrationNumber();

                    return Registration::create([
                        'registration_number' => $registrationNumber,
                        'competition_id' => $competition->id,
                        'participant_id' => $participantId,
                        'team_id' => $teamId,
                        'status' => RegistrationStatus::DRAFT,
                        'notes' => $data['notes'] ?? null,
                    ]);
                });
            } catch (\Illuminate\Database\QueryException $e) {
                // Check for duplicate key violation (SQLSTATE 23000 / Error 1062)
                $isDuplicateKey = $e->getCode() == 23000 || (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1062);
                if ($isDuplicateKey && $attempt < $maxAttempts) {
                    usleep(rand(10000, 50000)); // 10ms - 50ms random jitter backoff
                    continue;
                }
                throw $e;
            }
        }
    }

    /**
     * Upload a private registration document.
     */
    public function uploadDocument(
        Registration $registration,
        string $documentType,
        UploadedFile $file,
        User $user
    ): RegistrationDocument {
        if (!in_array($registration->status, [RegistrationStatus::DRAFT, RegistrationStatus::REVISION_REQUIRED])) {
            throw ValidationException::withMessages([
                'status' => ['Unggah dokumen hanya dapat dilakukan pada status draf atau revisi.'],
            ]);
        }

        return DB::transaction(function () use ($registration, $documentType, $file, $user) {
            // Private storage path: private/documents/{registration_id}
            $dir = 'private/documents/' . $registration->id;
            $path = $file->store($dir);

            $existing = RegistrationDocument::where('registration_id', $registration->id)
                ->where('document_type', $documentType)
                ->first();

            if ($existing) {
                // Delete previous file
                if ($existing->file_path && Storage::exists($existing->file_path)) {
                    Storage::delete($existing->file_path);
                }

                $existing->update([
                    'file_path' => $path,
                    'original_filename' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                    'verification_status' => DocumentVerificationStatus::PENDING,
                    'verification_note' => null,
                ]);

                $doc = $existing;
            } else {
                $doc = RegistrationDocument::create([
                    'registration_id' => $registration->id,
                    'document_type' => $documentType,
                    'file_path' => $path,
                    'original_filename' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                    'verification_status' => DocumentVerificationStatus::PENDING,
                ]);
            }

            ActivityLogService::log(
                action: 'registration.document_upload',
                entityType: 'RegistrationDocument',
                entityId: $doc->id,
                oldValues: [],
                newValues: ['document_type' => $documentType, 'filename' => $file->getClientOriginalName()],
                actor: $user
            );

            return $doc;
        });
    }

    /**
     * Submit registration final for review.
     */
    public function submit(Registration $registration, User $user): Registration
    {
        // Must be in draft or revision_required
        if (!in_array($registration->status, [RegistrationStatus::DRAFT, RegistrationStatus::REVISION_REQUIRED])) {
            throw ValidationException::withMessages([
                'status' => ['Pendaftaran tidak dalam status yang dapat dikirimkan.'],
            ]);
        }

        // Recheck competition deadline
        $competition = $registration->competition;
        if (now()->isAfter($competition->registration_deadline)) {
            throw ValidationException::withMessages([
                'competition' => ['Masa batas akhir pendaftaran telah lewat.'],
            ]);
        }

        // Ensure at least 1 document uploaded
        if ($registration->documents()->count() === 0) {
            throw ValidationException::withMessages([
                'documents' => ['Wajib mengunggah minimal satu berkas dokumen identitas sebelum mengirimkan pendaftaran.'],
            ]);
        }

        return DB::transaction(function () use ($registration, $user) {
            $registration->update([
                'status' => RegistrationStatus::SUBMITTED,
                'submitted_at' => now(),
            ]);

            ActivityLogService::log(
                action: 'registration.submit',
                entityType: 'Registration',
                entityId: $registration->id,
                oldValues: ['status' => RegistrationStatus::DRAFT->value],
                newValues: ['status' => RegistrationStatus::SUBMITTED->value],
                actor: $user
            );

            return $registration->fresh();
        });
    }

    /**
     * Admin review: approve, reject, or request revision with notes.
     */
    public function updateStatus(
        Registration $registration,
        RegistrationStatus $targetStatus,
        ?string $note,
        User $admin
    ): Registration {
        if (!$registration->status->canTransitionTo($targetStatus)) {
            throw ValidationException::withMessages([
                'status' => ["Transisi status dari '{$registration->status->value}' ke '{$targetStatus->value}' tidak diizinkan."],
            ]);
        }

        if (in_array($targetStatus, [RegistrationStatus::REVISION_REQUIRED, RegistrationStatus::REJECTED]) && empty(trim($note ?? ''))) {
            throw ValidationException::withMessages([
                'note' => ['Catatan alasan wajib diisi saat meminta revisi atau menolak pendaftaran.'],
            ]);
        }

        return DB::transaction(function () use ($registration, $targetStatus, $note, $admin) {
            $oldStatus = $registration->status->value;

            $registration->update([
                'status' => $targetStatus,
                'admin_notes' => $note,
                'verified_at' => now(),
                'verified_by' => $admin->id,
            ]);

            ActivityLogService::log(
                action: 'registration.status_update',
                entityType: 'Registration',
                entityId: $registration->id,
                oldValues: ['status' => $oldStatus],
                newValues: ['status' => $targetStatus->value, 'note' => $note],
                actor: $admin
            );

            // Notify registrant
            if ($registration->participant_id) {
                \App\Models\Notification::create([
                    'user_id' => $registration->participant_id,
                    'title' => 'Pembaruan Status Pendaftaran ' . $registration->registration_number,
                    'message' => "Status pendaftaran Anda pada kompetisi {$registration->competition->name} diperbarui menjadi: {$targetStatus->value}." . ($note ? " Catatan: {$note}" : ''),
                    'type' => 'registration',
                    'action_url' => "/portal/registrations/{$registration->id}",
                ]);
            }

            return $registration->fresh();
        });
    }

    /**
     * Generate unique registration number: ITC-YYYY-XXXXX
     *
     * Extracts only numeric suffixes matching the pattern to prevent collisions
     * with custom/test formats (such as REV01, OTHER99).
     * Locks matching rows in transaction to avoid race conditions.
     */
    public function generateRegistrationNumber(?string $year = null): string
    {
        $targetYear = $year ?: date('Y');
        $prefix = "ITC-{$targetYear}-";

        $query = Registration::where('registration_number', 'LIKE', "{$prefix}%");

        if (DB::transactionLevel() > 0 && DB::connection()->getDriverName() !== 'sqlite') {
            $query->lockForUpdate();
        }

        $existingNumbers = $query->pluck('registration_number');

        $maxSeq = 0;
        foreach ($existingNumbers as $regNum) {
            $suffix = substr($regNum, strlen($prefix));
            if (ctype_digit($suffix)) {
                $seqVal = (int) $suffix;
                if ($seqVal > $maxSeq) {
                    $maxSeq = $seqVal;
                }
            }
        }

        $nextSeq = $maxSeq + 1;
        $candidate = $prefix . str_pad((string) $nextSeq, 5, '0', STR_PAD_LEFT);

        // Pre-insert existence check in case of edge collisions
        while (Registration::where('registration_number', $candidate)->exists()) {
            $nextSeq++;
            $candidate = $prefix . str_pad((string) $nextSeq, 5, '0', STR_PAD_LEFT);
        }

        return $candidate;
    }
}
