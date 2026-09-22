<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CompetitionStatus;
use App\Enums\RegistrationStatus;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\Team;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RegistrationService
{
    /**
     * Get registrations for a participant.
     *
     * @return Collection<int, Registration>
     */
    public function getUserRegistrations(User $user): Collection
    {
        return Registration::query()
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereHas('team.members', fn ($q) => $q->where('user_id', $user->id));
            })
            ->with(['competition', 'team.leader', 'team.members.user', 'user', 'reviewer'])
            ->latest()
            ->get();
    }

    /**
     * Get single registration with authorization check.
     */
    public function getRegistration(User $user, int $id): Registration
    {
        /** @var Registration $registration */
        $registration = Registration::with([
            'competition',
            'team.leader',
            'team.members.user',
            'user',
            'reviewer',
        ])->findOrFail($id);

        if (! $user->isAdmin() && $registration->user_id !== $user->id) {
            $isTeamMember = $registration->team?->members()->where('user_id', $user->id)->exists() ?? false;
            if (! $isTeamMember) {
                throw ValidationException::withMessages([
                    'registration' => ['Anda tidak memiliki akses ke data registrasi ini.'],
                ]);
            }
        }

        return $registration;
    }

    /**
     * Create a new draft registration.
     *
     * @param  array<string, mixed>  $data
     */
    public function createRegistration(User $user, array $data): Registration
    {
        /** @var Competition $competition */
        $competition = Competition::findOrFail($data['competition_id']);

        // 1. Verify competition status & dates
        if (! $competition->is_published || $competition->status !== CompetitionStatus::RegistrationOpen) {
            throw ValidationException::withMessages([
                'competition_id' => ['Pendaftaran untuk cabang kompetisi ini sedang tidak dibuka.'],
            ]);
        }

        $now = now();
        if ($competition->registration_start && $now->lt($competition->registration_start)) {
            throw ValidationException::withMessages([
                'competition_id' => ['Periode pendaftaran untuk kompetisi ini belum dimulai.'],
            ]);
        }
        if ($competition->registration_end && $now->gt($competition->registration_end)) {
            throw ValidationException::withMessages([
                'competition_id' => ['Periode pendaftaran untuk kompetisi ini telah berakhir.'],
            ]);
        }

        // 2. Check education level
        if ($user->education_level && $user->education_level !== $competition->target_level->value) {
            throw ValidationException::withMessages([
                'user' => [
                    sprintf(
                        'Jenjang pendidikan Anda (%s) tidak memenuhi syarat untuk kompetisi %s.',
                        $user->education_level,
                        $competition->target_level->label()
                    ),
                ],
            ]);
        }

        // 3. Check duplicate user registration for this competition
        $userRegistered = Registration::where('competition_id', $competition->id)
            ->where('user_id', $user->id)
            ->where('status', '!=', RegistrationStatus::Cancelled)
            ->exists();

        if ($userRegistered) {
            throw ValidationException::withMessages([
                'competition_id' => ['Anda sudah memiliki pendaftaran aktif untuk cabang kompetisi ini.'],
            ]);
        }

        $teamId = null;

        // 4. Handle team competition
        if ($competition->isTeamBased()) {
            if (empty($data['team_id'])) {
                throw ValidationException::withMessages([
                    'team_id' => ['Cabang kompetisi ini membutuhkan tim. Silakan pilih atau buat tim terlebih dahulu.'],
                ]);
            }

            /** @var Team $team */
            $team = Team::findOrFail($data['team_id']);

            if ($team->competition_id !== $competition->id) {
                throw ValidationException::withMessages([
                    'team_id' => ['Tim yang dipilih tidak terdaftar pada cabang kompetisi ini.'],
                ]);
            }

            if ($team->leader_id !== $user->id) {
                throw ValidationException::withMessages([
                    'team_id' => ['Hanya ketua tim yang dapat mendaftarkan tim ke kompetisi.'],
                ]);
            }

            $teamRegistered = Registration::where('competition_id', $competition->id)
                ->where('team_id', $team->id)
                ->where('status', '!=', RegistrationStatus::Cancelled)
                ->exists();

            if ($teamRegistered) {
                throw ValidationException::withMessages([
                    'team_id' => ['Tim ini sudah didaftarkan pada cabang kompetisi ini.'],
                ]);
            }

            $teamId = $team->id;
        }

        return DB::transaction(function () use ($competition, $teamId, $user) {
            $regNumber = Registration::generateRegistrationNumber();

            $registration = Registration::create([
                'registration_number' => $regNumber,
                'competition_id' => $competition->id,
                'team_id' => $teamId,
                'user_id' => $user->id,
                'status' => RegistrationStatus::Draft,
            ]);

            return $registration->load(['competition', 'team.leader', 'team.members.user', 'user']);
        });
    }

    /**
     * Submit registration for review.
     */
    public function submitRegistration(Registration $registration, User $user): Registration
    {
        if (! in_array($registration->status, [RegistrationStatus::Draft, RegistrationStatus::RevisionRequired], true)) {
            throw ValidationException::withMessages([
                'registration' => [
                    sprintf('Pendaftaran tidak dapat disubmit karena berstatus "%s".', $registration->status->label()),
                ],
            ]);
        }

        if ($registration->user_id !== $user->id && ! $user->isAdmin()) {
            throw ValidationException::withMessages([
                'registration' => ['Hanya penanggung jawab pendaftaran yang dapat mengirimkan berkas pendaftaran.'],
            ]);
        }

        $competition = $registration->competition;

        // Check if registration still open
        if ($competition->status !== CompetitionStatus::RegistrationOpen ||
            ($competition->registration_end && now()->gt($competition->registration_end))) {
            throw ValidationException::withMessages([
                'registration' => ['Periode pendaftaran untuk kompetisi ini telah ditutup.'],
            ]);
        }

        // Check team rules if team based
        if ($competition->isTeamBased()) {
            $team = $registration->team;
            if (! $team) {
                throw ValidationException::withMessages([
                    'team' => ['Data tim tidak ditemukan untuk pendaftaran ini.'],
                ]);
            }

            $memberCount = $team->members()->count();
            if ($memberCount < $competition->min_team_member) {
                throw ValidationException::withMessages([
                    'team' => [
                        sprintf(
                            'Jumlah anggota tim belum memenuhi batas minimum (saat ini: %d, minimal: %d orang).',
                            $memberCount,
                            $competition->min_team_member
                        ),
                    ],
                ]);
            }

            if ($memberCount > $competition->max_team_member) {
                throw ValidationException::withMessages([
                    'team' => [
                        sprintf(
                            'Jumlah anggota tim melebihi batas maksimum (saat ini: %d, maksimal: %d orang).',
                            $memberCount,
                            $competition->max_team_member
                        ),
                    ],
                ]);
            }

            // Verify all members eligibility
            foreach ($team->members as $member) {
                $memberUser = $member->user;
                if ($memberUser && $memberUser->education_level && $memberUser->education_level !== $competition->target_level->value) {
                    throw ValidationException::withMessages([
                        'team' => [
                            sprintf(
                                'Anggota tim "%s" memiliki jenjang pendidikan (%s) yang tidak sesuai dengan kompetisi %s.',
                                $memberUser->name,
                                $memberUser->education_level,
                                $competition->target_level->label()
                            ),
                        ],
                    ]);
                }
            }
        }

        return DB::transaction(function () use ($registration) {
            $registration->update([
                'status' => RegistrationStatus::Submitted,
                'submitted_at' => now(),
            ]);

            return $registration->fresh(['competition', 'team.leader', 'team.members.user', 'user']);
        });
    }

    /**
     * Cancel registration.
     */
    public function cancelRegistration(Registration $registration, User $user): Registration
    {
        if (! $registration->canBeCancelled()) {
            throw ValidationException::withMessages([
                'registration' => [
                    sprintf('Pendaftaran dengan status "%s" tidak dapat dibatalkan.', $registration->status->label()),
                ],
            ]);
        }

        if ($registration->user_id !== $user->id && ! $user->isAdmin()) {
            throw ValidationException::withMessages([
                'registration' => ['Hanya penanggung jawab pendaftaran yang dapat membatalkan pendaftaran ini.'],
            ]);
        }

        $registration->update([
            'status' => RegistrationStatus::Cancelled,
        ]);

        return $registration->fresh(['competition', 'team', 'user']);
    }

    /**
     * Admin view: Paginated registrations list with search and filters.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getAdminPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Registration::query()->with([
            'competition',
            'team.leader',
            'team.members.user',
            'user',
            'reviewer',
        ]);

        if (! empty($filters['competition_id'])) {
            $query->where('competition_id', $filters['competition_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['education_level'])) {
            $query->whereHas('user', fn ($q) => $q->where('education_level', $filters['education_level']));
        }

        if (! empty($filters['registration_date'])) {
            $query->whereDate('created_at', $filters['registration_date']);
        }

        if (! empty($filters['search'])) {
            $term = (string) $filters['search'];
            $query->where(function ($q) use ($term) {
                $q->where('registration_number', 'like', "%{$term}%")
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%"))
                    ->orWhereHas('team', fn ($tq) => $tq->where('name', 'like', "%{$term}%"));
            });
        }

        return $query->latest('created_at')->paginate($perPage);
    }

    /**
     * Admin approves registration.
     */
    public function approveRegistration(Registration $registration, User $admin): Registration
    {
        if (! $registration->status->canTransitionTo(RegistrationStatus::Approved) && $registration->status !== RegistrationStatus::Submitted) {
            throw ValidationException::withMessages([
                'status' => [
                    sprintf('Pendaftaran berstatus "%s" tidak dapat disetujui langsung.', $registration->status->label()),
                ],
            ]);
        }

        $registration->update([
            'status' => RegistrationStatus::Approved,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
        ]);

        return $registration->fresh(['competition', 'team.leader', 'team.members.user', 'user', 'reviewer']);
    }

    /**
     * Admin rejects registration.
     */
    public function rejectRegistration(Registration $registration, User $admin, string $reason): Registration
    {
        if (! $registration->status->canTransitionTo(RegistrationStatus::Rejected) && $registration->status !== RegistrationStatus::Submitted) {
            throw ValidationException::withMessages([
                'status' => [
                    sprintf('Pendaftaran berstatus "%s" tidak dapat ditolak.', $registration->status->label()),
                ],
            ]);
        }

        $registration->update([
            'status' => RegistrationStatus::Rejected,
            'rejection_reason' => trim($reason),
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
        ]);

        return $registration->fresh(['competition', 'team.leader', 'team.members.user', 'user', 'reviewer']);
    }

    /**
     * Admin requests registration revision.
     */
    public function requestRevision(Registration $registration, User $admin, string $note): Registration
    {
        if (! $registration->status->canTransitionTo(RegistrationStatus::RevisionRequired) && $registration->status !== RegistrationStatus::Submitted) {
            throw ValidationException::withMessages([
                'status' => [
                    sprintf('Pendaftaran berstatus "%s" tidak dapat diminta revisi.', $registration->status->label()),
                ],
            ]);
        }

        $registration->update([
            'status' => RegistrationStatus::RevisionRequired,
            'revision_note' => trim($note),
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
        ]);

        return $registration->fresh(['competition', 'team.leader', 'team.members.user', 'user', 'reviewer']);
    }
}
