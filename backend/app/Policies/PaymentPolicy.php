<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Payment $payment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $payment->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isParticipant() || $user->isAdmin();
    }

    public function verify(User $user, Payment $payment): bool
    {
        return $user->isAdmin();
    }
}
