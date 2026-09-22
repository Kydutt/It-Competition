<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    /**
     * Determine whether the user can view the submission.
     */
    public function view(User $user, Submission $submission): bool
    {
        if ($user->isAdmin() || $user->isJudge()) {
            return true;
        }

        $reg = $submission->registration;
        if ($reg && $reg->user_id === $user->id) {
            return true;
        }

        $team = $submission->team ?? $reg?->team;
        if ($team && $team->members()->where('user_id', $user->id)->exists()) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can modify files or submit work.
     */
    public function update(User $user, Submission $submission): bool
    {
        if ($submission->isLocked()) {
            return false;
        }

        $reg = $submission->registration;
        if (! $reg) {
            return false;
        }

        // Must be owner of registration or leader of the team
        $team = $submission->team ?? $reg->team;
        if ($team) {
            return $team->leader_id === $user->id;
        }

        return $reg->user_id === $user->id;
    }

    /**
     * Determine whether the user can upload a file.
     */
    public function uploadFile(User $user, Submission $submission): bool
    {
        return $this->update($user, $submission);
    }

    /**
     * Determine whether the user can delete a file.
     */
    public function deleteFile(User $user, Submission $submission): bool
    {
        return $this->update($user, $submission);
    }

    /**
     * Determine whether the user can finalize submission.
     */
    public function submit(User $user, Submission $submission): bool
    {
        return $this->update($user, $submission);
    }

    /**
     * Determine whether the user can download a submission file.
     */
    public function downloadFile(User $user, Submission $submission): bool
    {
        return $this->view($user, $submission);
    }
}
