<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\TeamMemberRole;
use App\Models\Competition;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TeamService
{
    /**
     * Create a team with leader and optional members.
     *
     * @param  array<string, mixed>  $data
     */
    public function createTeam(User $leader, array $data): Team
    {
        return DB::transaction(function () use ($leader, $data) {
            $competition = Competition::findOrFail($data['competition_id']);

            $existing = Team::where('competition_id', $competition->id)
                ->where('leader_id', $leader->id)
                ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'competition_id' => ['You already lead a team in this competition.'],
                ]);
            }

            $code = strtoupper(Str::random(8));

            $team = Team::create([
                'competition_id' => $competition->id,
                'leader_id' => $leader->id,
                'name' => $data['name'],
                'code' => $code,
                'institution' => $data['institution'],
                'status' => 'ACTIVE',
            ]);

            // Add leader as team member
            TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $leader->id,
                'name' => $leader->name,
                'email' => $leader->email,
                'phone' => $leader->phone,
                'role' => TeamMemberRole::Leader,
            ]);

            // Add additional members if provided
            if (! empty($data['members']) && is_array($data['members'])) {
                $maxAdditional = $competition->max_team_members - 1;
                $membersToAdd = array_slice($data['members'], 0, $maxAdditional);

                foreach ($membersToAdd as $memberData) {
                    TeamMember::create([
                        'team_id' => $team->id,
                        'name' => $memberData['name'],
                        'email' => $memberData['email'],
                        'phone' => $memberData['phone'] ?? null,
                        'role' => TeamMemberRole::Member,
                    ]);
                }
            }

            return $team->load(['members', 'competition']);
        });
    }

    /**
     * Get teams where the user is leader or member.
     *
     * @return Collection<int, Team>
     */
    public function getUserTeams(User $user): Collection
    {
        return Team::where('leader_id', $user->id)
            ->orWhereHas('members', fn ($q) => $q->where('user_id', $user->id)->orWhere('email', $user->email))
            ->with(['competition', 'members'])
            ->get();
    }
}
