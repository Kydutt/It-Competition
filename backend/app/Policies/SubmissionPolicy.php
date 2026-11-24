<?php

namespace App\Policies;

use App\Enums\RegistrationStatus;
use App\Enums\SubmissionStatus;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    public function view(User $user, Submission $submission): bool
    {
        $registration = $submission->registration;
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

    public function create(User $user, Registration $registration): bool
    {
        // Only approved registrations can submit work
        if ($registration->status !== RegistrationStatus::APPROVED) {
            return false;
        }

        // Check ownership
        $isOwner = ($registration->participant_id === $user->id) 
            || ($registration->team_id && $registration->team && $registration->team->leader_id === $user->id);

        if (!$isOwner) {
            return false;
        }

        // Check submission deadline
        if ($registration->competition->submission_deadline && now()->isAfter($registration->competition->submission_deadline)) {
            return false;
        }

        return true;
    }

    public function addRevision(User $user, Submission $submission): bool
    {
        if ($submission->status !== SubmissionStatus::REVISION_REQUIRED) {
            return false;
        }

        return $this->view($user, $submission);
    }

    public function review(User $user, Submission $submission): bool
    {
        return $user->isAdmin();
    }

    public function download(User $user, Submission $submission): bool
    {
        return $this->view($user, $submission);
    }
}
