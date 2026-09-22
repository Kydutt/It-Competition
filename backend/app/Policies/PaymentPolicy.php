<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    /**
     * Determine whether the user can view the payment.
     */
    public function view(User $user, Payment $payment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($payment->user_id === $user->id) {
            return true;
        }

        if ($payment->registration && $payment->registration->user_id === $user->id) {
            return true;
        }

        $team = $payment->registration?->team;
        if ($team && $team->members()->where('user_id', $user->id)->exists()) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can upload payment proof.
     */
    public function uploadProof(User $user, Payment $payment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $isOwner = $payment->user_id === $user->id || $payment->registration?->user_id === $user->id;

        return $isOwner && $payment->canUploadProof();
    }

    /**
     * Determine whether the user can submit payment for review.
     */
    public function submit(User $user, Payment $payment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $isOwner = $payment->user_id === $user->id || $payment->registration?->user_id === $user->id;

        return $isOwner && ! empty($payment->proof_path) && ! $payment->isApproved();
    }

    /**
     * Determine whether the user can download payment proof.
     */
    public function downloadProof(User $user, Payment $payment): bool
    {
        return $this->view($user, $payment);
    }

    /**
     * Determine whether the user can approve or reject payment.
     */
    public function review(User $user, Payment $payment): bool
    {
        return $user->isAdmin();
    }
}
