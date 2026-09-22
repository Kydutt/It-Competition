<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Team $team): bool
    {
        if ($user->isAdmin() || $user->isJudge()) {
            return true;
        }

        return $team->leader_id === $user->id || $team->members()->where('user_id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->isParticipant() || $user->isAdmin();
    }

    public function update(User $user, Team $team): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $team->leader_id === $user->id;
    }

    public function delete(User $user, Team $team): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $team->leader_id === $user->id;
    }
}
