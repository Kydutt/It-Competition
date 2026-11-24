<?php

namespace App\Policies;

use App\Models\RegistrationDocument;
use App\Models\User;

class RegistrationDocumentPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    public function download(User $user, RegistrationDocument $document): bool
    {
        $registration = $document->registration;
        if (!$registration) {
            return false;
        }

        if ($registration->participant_id === $user->id) {
            return true;
        }

        if ($registration->team_id && $registration->team) {
            return $registration->team->leader_id === $user->id
                || $registration->team->members()->where('users.id', $user->id)->exists();
        }

        return false;
    }
}
