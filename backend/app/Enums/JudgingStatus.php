<?php

declare(strict_types=1);

namespace App\Enums;

enum JudgingStatus: string
{
    case NotStarted = 'NOT_STARTED';
    case InProgress = 'IN_PROGRESS';
    case Completed = 'COMPLETED';
}
