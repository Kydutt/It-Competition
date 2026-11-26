<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Payment;
use App\Models\Registration;
use App\Models\User;

class PaymentPolicy
{
    /**
     * Determine whether the user can view the payment (admin, owner, or team member per PD-05).
     */
    public function view(User $user, Payment $payment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($payment->user_id === $user->id) {
            return true;
        }

        $registration = $payment->registration;
        if (! $registration) {
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

    /**
     * Determine whether the user can initiate a Snap payment for a registration (PD-05).
     */
    public function create(User $user, Registration $registration): bool
    {
        if ($registration->team_id !== null) {
            $registration->loadMissing('team');

            return $registration->team !== null && $registration->team->leader_id === $user->id;
        }

        return $registration->participant_id === $user->id;
    }

    /**
     * Determine whether the user can trigger status reconciliation against Midtrans Status API.
     */
    public function sync(User $user, Payment $payment): bool
    {
        return $this->view($user, $payment);
    }
}
