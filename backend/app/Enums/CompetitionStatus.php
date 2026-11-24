<?php

namespace App\Enums;

enum CompetitionStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case REGISTRATION_OPEN = 'registration_open';
    case REGISTRATION_CLOSED = 'registration_closed';
    case ONGOING = 'ongoing';
    case COMPLETED = 'completed';
    case ARCHIVED = 'archived';
}
