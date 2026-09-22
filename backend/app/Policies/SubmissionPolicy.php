<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Submission $submission): bool
    {
        if ($user->isAdmin() || $user->isJudge()) {
            return true;
        }

        $team = $submission->team;

        return $team && ($team->leader_id === $user->id || $team->members()->where('user_id', $user->id)->exists());
    }

    public function create(User $user): bool
    {
        return $user->isParticipant() || $user->isAdmin();
    }

    public function update(User $user, Submission $submission): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $team = $submission->team;

        return $team && $team->leader_id === $user->id;
    }
}
