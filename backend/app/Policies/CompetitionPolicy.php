<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Competition;
use App\Models\User;

class CompetitionPolicy
{
    /**
     * Determine whether any user (including unauthenticated/guest) can view any competitions.
     */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the competition.
     */
    public function view(?User $user, Competition $competition): bool
    {
        if ($competition->is_published) {
            return true;
        }

        return $user?->isAdmin() ?? false;
    }

    /**
     * Determine whether the user can create competitions.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the competition.
     */
    public function update(User $user, Competition $competition): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the competition.
     */
    public function delete(User $user, Competition $competition): bool
    {
        return $user->isAdmin();
    }
}
