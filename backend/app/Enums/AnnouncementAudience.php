<?php

namespace App\Enums;

enum AnnouncementAudience: string
{
    case PUBLIC = 'public';
    case ALL_PARTICIPANTS = 'all_participants';
    case SPECIFIC_COMPETITION = 'specific_competition';
}
