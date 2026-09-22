<?php

declare(strict_types=1);

namespace App\Enums;

enum RegistrationStatus: string
{
    case Draft = 'DRAFT';
    case Submitted = 'SUBMITTED';
    case InReview = 'IN_REVIEW';
    case RevisionRequired = 'REVISION_REQUIRED';
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';
    case Cancelled = 'CANCELLED';
}
