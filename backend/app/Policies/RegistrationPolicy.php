<?php

namespace App\Policies;

use App\Enums\RegistrationStatus;
use App\Models\Registration;
use App\Models\User;

class RegistrationPolicy
{
    /**
     * Admin has full permissions across all registrations.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    /**
     * Determine whether the user can view the registration.
     */
    public function view(User $user, Registration $registration): bool
    {
        if ($registration->participant_id === $user->id) {
            return true;
        }

        if ($registration->team_id && $registration->team) {
            return $registration->team->leader_id === $user->id
                || $registration->team->members()->where('users.id', $user->id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can update the registration draft.
     */
    public function update(User $user, Registration $registration): bool
    {
        // Only draft or revision_required can be modified
        if (!in_array($registration->status, [RegistrationStatus::DRAFT, RegistrationStatus::REVISION_REQUIRED])) {
            return false;
        }

        return $this->isOwnerOrLeader($user, $registration);
    }

    /**
     * Determine whether the user can submit the registration.
     */
    public function submit(User $user, Registration $registration): bool
    {
        if (!in_array($registration->status, [RegistrationStatus::DRAFT, RegistrationStatus::REVISION_REQUIRED])) {
            return false;
        }

        return $this->isOwnerOrLeader($user, $registration);
    }

    /**
     * Determine whether the user can upload documents to the registration.
     */
    public function uploadDocument(User $user, Registration $registration): bool
    {
        if (!in_array($registration->status, [RegistrationStatus::DRAFT, RegistrationStatus::REVISION_REQUIRED])) {
            return false;
        }

        return $this->isOwnerOrLeader($user, $registration);
    }

    /**
     * Determine whether the user can change registration status (Admin only).
     */
    public function changeStatus(User $user, Registration $registration): bool
    {
        return $user->isAdmin();
    }

    /**
     * Helper to verify if the user is the direct participant or the team leader.
     */
    protected function isOwnerOrLeader(User $user, Registration $registration): bool
    {
        if ($registration->participant_id === $user->id) {
            return true;
        }

        if ($registration->team_id && $registration->team) {
            return $registration->team->leader_id === $user->id;
        }

        return false;
    }
}
