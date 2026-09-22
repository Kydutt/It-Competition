<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CompetitionStatus;
use App\Enums\TeamMemberRole;
use App\Models\Competition;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeamService
{
    /**
     * Get all teams where user is either leader or member.
     *
     * @return Collection<int, Team>
     */
    public function getUserTeams(User $user): Collection
    {
        return Team::query()
            ->where('leader_id', $user->id)
            ->orWhereHas('members', fn ($q) => $q->where('user_id', $user->id))
            ->with(['competition', 'leader', 'members.user', 'registration'])
            ->latest()
            ->get();
    }

    /**
     * Create a new team for a team-based competition.
     *
     * @param  array<string, mixed>  $data
     */
    public function createTeam(User $user, array $data): Team
    {
        /** @var Competition $competition */
        $competition = Competition::findOrFail($data['competition_id']);

        // 1. Verify competition state and type
        if (! $competition->is_published || $competition->status !== CompetitionStatus::RegistrationOpen) {
            throw ValidationException::withMessages([
                'competition_id' => ['Pendaftaran untuk cabang kompetisi ini sedang tidak dibuka.'],
            ]);
        }

        if ($competition->isIndividual()) {
            throw ValidationException::withMessages([
                'competition_id' => ['Kompetisi ini bersifat individu dan tidak memerlukan pembentukan tim.'],
            ]);
        }

        // 2. Check registration period
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

        // 3. Check education level eligibility
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

        // 4. Check user is not already registered/in a team for this competition
        $alreadyInTeam = TeamMember::where('user_id', $user->id)
            ->whereHas('team', fn ($q) => $q->where('competition_id', $competition->id))
            ->exists();

        if ($alreadyInTeam) {
            throw ValidationException::withMessages([
                'user' => ['Anda sudah terdaftar dalam tim lain pada cabang kompetisi ini.'],
            ]);
        }

        // 5. Check team name uniqueness in competition
        $nameTrimmed = trim((string) $data['name']);
        if (Team::where('competition_id', $competition->id)->where('name', $nameTrimmed)->exists()) {
            throw ValidationException::withMessages([
                'name' => ['Nama tim ini sudah digunakan oleh tim lain pada cabang kompetisi yang sama.'],
            ]);
        }

        return DB::transaction(function () use ($user, $competition, $nameTrimmed, $data) {
            $team = Team::create([
                'competition_id' => $competition->id,
                'leader_id' => $user->id,
                'name' => $nameTrimmed,
                'institution' => $data['institution'] ?? $user->institution,
            ]);

            TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $user->id,
                'role' => TeamMemberRole::Leader,
                'joined_at' => now(),
            ]);

            return $team->load(['competition', 'leader', 'members.user', 'registration']);
        });
    }

    /**
     * Join an existing team using invite code with concurrency locking.
     */
    public function joinTeam(User $user, string $code): TeamMember
    {
        $cleanCode = strtoupper(trim($code));

        return DB::transaction(function () use ($user, $cleanCode) {
            /** @var Team|null $team */
            $team = Team::where('code', $cleanCode)->lockForUpdate()->first();

            if (! $team) {
                throw ValidationException::withMessages([
                    'code' => ['Kode tim tidak valid atau tidak ditemukan.'],
                ]);
            }

            $competition = $team->competition;

            // 1. Check if team is locked
            if ($team->isLocked()) {
                throw ValidationException::withMessages([
                    'code' => ['Keanggotaan tim ini telah dikunci karena pendaftaran sedang diverifikasi atau telah disetujui.'],
                ]);
            }

            // 2. Check competition registration period
            $now = now();
            if ($competition->status !== CompetitionStatus::RegistrationOpen ||
                ($competition->registration_end && $now->gt($competition->registration_end))) {
                throw ValidationException::withMessages([
                    'code' => ['Periode pendaftaran untuk kompetisi tim ini telah ditutup.'],
                ]);
            }

            // 3. Check user education level
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

            // 4. Check if user already in a team for this competition
            $alreadyInTeam = TeamMember::where('user_id', $user->id)
                ->whereHas('team', fn ($q) => $q->where('competition_id', $competition->id))
                ->exists();

            if ($alreadyInTeam) {
                throw ValidationException::withMessages([
                    'user' => ['Anda sudah terdaftar dalam tim lain pada cabang kompetisi ini.'],
                ]);
            }

            // 5. Check team capacity under lock
            $currentCount = $team->members()->count();
            if ($currentCount >= $competition->max_team_member) {
                throw ValidationException::withMessages([
                    'code' => [sprintf('Tim "%s" sudah mencapai batas maksimum anggota (%d orang).', $team->name, $competition->max_team_member)],
                ]);
            }

            return TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $user->id,
                'role' => TeamMemberRole::Member,
                'joined_at' => now(),
            ])->load(['team.competition', 'user']);
        });
    }

    /**
     * Member leaves team.
     */
    public function leaveTeam(User $user, Team $team): bool
    {
        if ($team->isLocked()) {
            throw ValidationException::withMessages([
                'team' => ['Tidak dapat meninggalkan tim karena pendaftaran sedang diverifikasi atau sudah disetujui.'],
            ]);
        }

        if ($team->leader_id === $user->id) {
            throw ValidationException::withMessages([
                'team' => ['Ketua tim tidak dapat meninggalkan tim secara langsung. Silakan alihkan kepemimpinan terlebih dahulu atau hapus tim.'],
            ]);
        }

        $member = TeamMember::where('team_id', $team->id)->where('user_id', $user->id)->first();
        if (! $member) {
            throw ValidationException::withMessages([
                'team' => ['Anda bukan anggota dari tim ini.'],
            ]);
        }

        return (bool) $member->delete();
    }

    /**
     * Leader removes a team member.
     */
    public function removeMember(User $leader, Team $team, User $member): bool
    {
        if ($team->leader_id !== $leader->id) {
            throw ValidationException::withMessages([
                'team' => ['Hanya ketua tim yang memiliki hak untuk mengeluarkan anggota tim.'],
            ]);
        }

        if ($team->isLocked()) {
            throw ValidationException::withMessages([
                'team' => ['Keanggotaan tim terkunci karena pendaftaran sedang diverifikasi atau sudah disetujui.'],
            ]);
        }

        if ($member->id === $leader->id) {
            throw ValidationException::withMessages([
                'member' => ['Ketua tim tidak dapat menghapus dirinya sendiri dari tim.'],
            ]);
        }

        $membership = TeamMember::where('team_id', $team->id)->where('user_id', $member->id)->first();
        if (! $membership) {
            throw ValidationException::withMessages([
                'member' => ['Pengguna tersebut bukan anggota dari tim ini.'],
            ]);
        }

        return (bool) $membership->delete();
    }

    /**
     * Leader transfers team leadership to an existing team member.
     */
    public function transferLeadership(User $leader, Team $team, User $newLeader): Team
    {
        if ($team->leader_id !== $leader->id) {
            throw ValidationException::withMessages([
                'team' => ['Hanya ketua tim yang memiliki wewenang mengalihkan kepemimpinan.'],
            ]);
        }

        if ($team->isLocked()) {
            throw ValidationException::withMessages([
                'team' => ['Kepemimpinan tim tidak dapat diubah karena pendaftaran telah disubmit/disetujui.'],
            ]);
        }

        if ($newLeader->id === $leader->id) {
            throw ValidationException::withMessages([
                'user_id' => ['Pengguna yang dipilih sudah menjadi ketua tim.'],
            ]);
        }

        $newLeaderMembership = TeamMember::where('team_id', $team->id)->where('user_id', $newLeader->id)->first();
        if (! $newLeaderMembership) {
            throw ValidationException::withMessages([
                'user_id' => ['Calon ketua baru harus sudah menjadi anggota aktif di dalam tim.'],
            ]);
        }

        return DB::transaction(function () use ($leader, $team, $newLeader, $newLeaderMembership) {
            // Update team leader
            $team->update(['leader_id' => $newLeader->id]);

            // Demote old leader to member
            TeamMember::where('team_id', $team->id)->where('user_id', $leader->id)->update([
                'role' => TeamMemberRole::Member,
            ]);

            // Promote new leader
            $newLeaderMembership->update([
                'role' => TeamMemberRole::Leader,
            ]);

            return $team->fresh(['competition', 'leader', 'members.user', 'registration']);
        });
    }

    /**
     * Dissolve team if not locked or submitted.
     */
    public function dissolveTeam(User $leader, Team $team): bool
    {
        if ($team->leader_id !== $leader->id) {
            throw ValidationException::withMessages([
                'team' => ['Hanya ketua tim yang dapat membubarkan tim.'],
            ]);
        }

        if ($team->isLocked()) {
            throw ValidationException::withMessages([
                'team' => ['Tim tidak dapat dibubarkan karena pendaftaran sedang diverifikasi atau sudah disetujui.'],
            ]);
        }

        return (bool) $team->delete();
    }
}
