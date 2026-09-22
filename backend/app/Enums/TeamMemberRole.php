<?php

declare(strict_types=1);

namespace App\Enums;

enum TeamMemberRole: string
{
    case Leader = 'LEADER';
    case Member = 'MEMBER';
}
