<?php

namespace App\Enums;

enum TeamMemberRole: string
{
    case LEADER = 'leader';
    case MEMBER = 'member';
}
