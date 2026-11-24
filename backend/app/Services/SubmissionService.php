<?php

namespace App\Services;

use App\Enums\RegistrationStatus;
use App\Enums\SubmissionStatus;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmissionService
{
    /**
     * Submit competition project/work.
     */
    public function submitWork(Registration $registration, array $data, User $actor): Submission
    {
        if ($registration->status !== RegistrationStatus::APPROVED) {
            throw ValidationException::withMessages([
                'registration' => ['Pengumpulan karya hanya dapat dilakukan pada pendaftaran yang telah disetujui.'],
            ]);
        }

        $competition = $registration->competition;
        if ($competition->submission_deadline && now()->isAfter($competition->submission_deadline)) {
            throw ValidationException::withMessages([
                'submission' => ['Batas akhir pengumpulan karya kompetisi telah terlewati.'],
            ]);
        }

        return DB::transaction(function () use ($registration, $data, $actor) {
            $submission = Submission::create([
                'registration_id' => $registration->id,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'file_path' => $data['file_path'] ?? null,
                'external_url' => $data['external_url'] ?? null,
                'repository_url' => $data['repository_url'] ?? null,
                'status' => SubmissionStatus::SUBMITTED,
                'submitted_at' => now(),
            ]);

            ActivityLogService::log(
                action: 'submission.create',
                entityType: 'Submission',
                entityId: $submission->id,
                oldValues: null,
                newValues: ['title' => $submission->title],
                actor: $actor
            );

            return $submission;
        });
    }

    /**
     * Submit a revision for an existing submission.
     */
    public function submitRevision(Submission $submission, array $data, User $actor): Submission
    {
        if ($submission->status !== SubmissionStatus::REVISION_REQUIRED) {
            throw ValidationException::withMessages([
                'status' => ['Revisi hanya dapat dikirimkan jika karya berstatus perlu revisi.'],
            ]);
        }

        return DB::transaction(function () use ($submission, $data, $actor) {
            // Save old state to revisions history
            $submission->revisions()->create([
                'file_path' => $submission->file_path,
                'external_url' => $submission->external_url,
                'revision_note' => $data['revision_note'] ?? 'Revisi diajukan oleh peserta',
                'submitted_at' => now(),
            ]);

            // Update submission with new fields and reset status to submitted
            $submission->update([
                'file_path' => $data['file_path'] ?? $submission->file_path,
                'external_url' => $data['external_url'] ?? $submission->external_url,
                'status' => SubmissionStatus::SUBMITTED,
                'submitted_at' => now(),
            ]);

            ActivityLogService::log(
                action: 'submission.revision',
                entityType: 'Submission',
                entityId: $submission->id,
                oldValues: ['status' => SubmissionStatus::REVISION_REQUIRED->value],
                newValues: ['status' => SubmissionStatus::SUBMITTED->value],
                actor: $actor
            );

            return $submission->fresh();
        });
    }

    /**
     * Admin review for submission.
     */
    public function reviewSubmission(
        Submission $submission,
        SubmissionStatus $targetStatus,
        ?string $notes,
        User $admin
    ): Submission {
        if (!$submission->status->canTransitionTo($targetStatus)) {
            $currentLabel = match ($submission->status) {
                SubmissionStatus::NOT_SUBMITTED => 'Belum Dikumpulkan',
                SubmissionStatus::SUBMITTED => 'Terkirim (Menunggu Review)',
                SubmissionStatus::UNDER_REVIEW => 'Sedang Ditinjau',
                SubmissionStatus::REVISION_REQUIRED => 'Perlu Revisi (Menunggu Peserta)',
                SubmissionStatus::ACCEPTED => 'Disetujui',
                SubmissionStatus::REJECTED => 'Ditolak',
            };

            $targetLabel = match ($targetStatus) {
                SubmissionStatus::NOT_SUBMITTED => 'Belum Dikumpulkan',
                SubmissionStatus::SUBMITTED => 'Terkirim',
                SubmissionStatus::UNDER_REVIEW => 'Sedang Ditinjau',
                SubmissionStatus::REVISION_REQUIRED => 'Perlu Revisi',
                SubmissionStatus::ACCEPTED => 'Disetujui',
                SubmissionStatus::REJECTED => 'Ditolak',
            };

            $message = "Transisi status dari '{$currentLabel}' ke '{$targetLabel}' tidak diizinkan.";
            if ($submission->status === SubmissionStatus::REVISION_REQUIRED) {
                $message .= ' Karya sedang dalam tahap perbaikan oleh peserta. Harap tunggu peserta mengirimkan revisi terlebih dahulu.';
            } elseif (in_array($submission->status, [SubmissionStatus::ACCEPTED, SubmissionStatus::REJECTED])) {
                $message .= ' Status karya saat ini sudah bersifat final.';
            }

            throw ValidationException::withMessages([
                'status' => [$message],
            ]);
        }

        $cleanedNotes = $notes !== null ? trim($notes) : null;

        if (in_array($targetStatus, [SubmissionStatus::REVISION_REQUIRED, SubmissionStatus::REJECTED], true) && empty($cleanedNotes)) {
            throw ValidationException::withMessages([
                'notes' => ['Catatan alasan wajib diisi saat meminta revisi atau menolak karya.'],
            ]);
        }

        return DB::transaction(function () use ($submission, $targetStatus, $cleanedNotes, $admin) {
            $oldStatus = $submission->status->value;

            $submission->update([
                'status' => $targetStatus,
                'review_note' => $cleanedNotes,
                'reviewed_by' => $admin->id,
            ]);

            ActivityLogService::log(
                action: 'submission.review',
                entityType: 'Submission',
                entityId: $submission->id,
                oldValues: ['status' => $oldStatus],
                newValues: ['status' => $targetStatus->value, 'notes' => $cleanedNotes],
                actor: $admin
            );

            // Notify participant
            $registration = $submission->registration;
            if ($registration && $registration->participant_id) {
                \App\Models\Notification::create([
                    'user_id' => $registration->participant_id,
                    'title' => 'Pembaruan Peninjauan Karya: ' . $submission->title,
                    'message' => "Karya Anda kini berstatus: {$targetStatus->value}." . ($cleanedNotes ? " Catatan: {$cleanedNotes}" : ''),
                    'type' => 'submission',
                    'action_url' => "/portal/submissions/{$submission->id}",
                ]);
            }

            return $submission->fresh();
        });
    }
}
