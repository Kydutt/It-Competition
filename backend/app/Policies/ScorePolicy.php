<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Score;
use App\Models\User;

class ScorePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isJudge();
    }

    public function view(User $user, Score $score): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isJudge() && $score->judge_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isJudge() || $user->isAdmin();
    }

    public function update(User $user, Score $score): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isJudge() && $score->judge_id === $user->id;
    }
}
