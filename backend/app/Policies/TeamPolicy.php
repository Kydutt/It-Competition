<?php

namespace App\Policies;

use App\Enums\RegistrationStatus;
use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    public function view(User $user, Team $team): bool
    {
        return $team->leader_id === $user->id 
            || $team->members()->where('users.id', $user->id)->exists();
    }

    public function update(User $user, Team $team): bool
    {
        if ($team->leader_id !== $user->id) {
            return false;
        }

        // Teams cannot be mutated freely if an active submitted registration exists
        $hasActiveRegistration = $team->registrations()
            ->whereIn('status', [RegistrationStatus::SUBMITTED, RegistrationStatus::UNDER_REVIEW, RegistrationStatus::APPROVED])
            ->exists();

        return !$hasActiveRegistration;
    }

    public function addMember(User $user, Team $team): bool
    {
        return $this->update($user, $team);
    }

    public function removeMember(User $user, Team $team, User $member): bool
    {
        // Cannot remove the leader
        if ($member->id === $team->leader_id) {
            return false;
        }

        return $this->update($user, $team);
    }
}
