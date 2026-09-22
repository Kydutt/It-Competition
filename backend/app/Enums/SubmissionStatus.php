<?php

declare(strict_types=1);

namespace App\Enums;

enum SubmissionStatus: string
{
    case NotOpen = 'NOT_OPEN';
    case Open = 'OPEN';
    case Submitted = 'SUBMITTED';
    case UnderReview = 'UNDER_REVIEW';
    case RevisionRequired = 'REVISION_REQUIRED';
    case Accepted = 'ACCEPTED';
    case Locked = 'LOCKED';
}
