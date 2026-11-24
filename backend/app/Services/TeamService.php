<?php

namespace App\Services;

use App\Enums\RegistrationStatus;
use App\Enums\TeamMemberRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TeamService
{
    /**
     * Create a new team with leader automatically registered as member.
     */
    public function createTeam(User $leader, string $name): Team
    {
        return DB::transaction(function () use ($leader, $name) {
            $teamCode = 'TM-' . strtoupper(Str::random(6));

            $team = Team::create([
                'name' => $name,
                'team_code' => $teamCode,
                'leader_id' => $leader->id,
            ]);

            $team->teamMembers()->create([
                'user_id' => $leader->id,
                'member_role' => TeamMemberRole::LEADER,
                'joined_at' => now(),
            ]);

            return $team->load('members');
        });
    }

    /**
     * Add a member to the team by email.
     */
    public function addMemberByEmail(Team $team, string $email): void
    {
        $user = User::where('email', strtolower(trim($email)))->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Pengguna dengan alamat email ini tidak ditemukan.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Akun pengguna ini sedang tidak aktif.'],
            ]);
        }

        if ($team->members()->where('users.id', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['Pengguna sudah terdaftar di tim ini.'],
            ]);
        }

        $team->teamMembers()->create([
            'user_id' => $user->id,
            'member_role' => TeamMemberRole::MEMBER,
            'joined_at' => now(),
        ]);
    }

    /**
     * Remove a member from the team.
     */
    public function removeMember(Team $team, User $member): void
    {
        if ($member->id === $team->leader_id) {
            throw ValidationException::withMessages([
                'member' => ['Ketua tim tidak dapat dihapus dari keanggotaan tim.'],
            ]);
        }

        $teamMember = $team->teamMembers()->where('user_id', $member->id)->first();

        if (!$teamMember) {
            throw ValidationException::withMessages([
                'member' => ['Anggota tidak ditemukan dalam tim ini.'],
            ]);
        }

        $teamMember->delete();
    }
}
