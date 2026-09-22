<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Registration;
use App\Models\User;

class RegistrationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Registration $registration): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $registration->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isParticipant() || $user->isAdmin();
    }

    public function update(User $user, Registration $registration): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $registration->user_id === $user->id;
    }

    public function verify(User $user, Registration $registration): bool
    {
        return $user->isAdmin();
    }
}
