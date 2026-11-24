<?php

namespace App\Enums;

enum SubmissionStatus: string
{
    case NOT_SUBMITTED = 'not_submitted';
    case SUBMITTED = 'submitted';
    case UNDER_REVIEW = 'under_review';
    case REVISION_REQUIRED = 'revision_required';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';

    public function canTransitionTo(self $target): bool
    {
        return match ($this) {
            self::NOT_SUBMITTED => in_array($target, [self::SUBMITTED]),
            self::SUBMITTED => in_array($target, [self::UNDER_REVIEW, self::REVISION_REQUIRED, self::ACCEPTED, self::REJECTED]),
            self::UNDER_REVIEW => in_array($target, [self::REVISION_REQUIRED, self::ACCEPTED, self::REJECTED]),
            self::REVISION_REQUIRED => in_array($target, [self::SUBMITTED]),
            self::ACCEPTED, self::REJECTED => false,
        };
    }
}
