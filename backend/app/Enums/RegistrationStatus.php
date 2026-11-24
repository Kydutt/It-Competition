<?php

namespace App\Enums;

enum RegistrationStatus: string
{
    case DRAFT = 'draft';
    case SUBMITTED = 'submitted';
    case UNDER_REVIEW = 'under_review';
    case REVISION_REQUIRED = 'revision_required';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case CANCELLED = 'cancelled';

    /**
     * Determine if a transition to the target status is allowed from current status.
     */
    public function canTransitionTo(self $target): bool
    {
        return match ($this) {
            self::DRAFT => in_array($target, [self::SUBMITTED, self::CANCELLED]),
            self::SUBMITTED => in_array($target, [self::UNDER_REVIEW, self::REVISION_REQUIRED, self::APPROVED, self::REJECTED]),
            self::UNDER_REVIEW => in_array($target, [self::REVISION_REQUIRED, self::APPROVED, self::REJECTED]),
            self::REVISION_REQUIRED => in_array($target, [self::SUBMITTED, self::CANCELLED]),
            self::APPROVED, self::REJECTED, self::CANCELLED => false,
        };
    }
}
