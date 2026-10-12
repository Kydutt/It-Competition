<?php

declare(strict_types=1);

namespace App\Enums;

enum JudgeAssignmentStatus: string
{
    case Assigned = 'assigned';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Conflict = 'conflict_of_interest';

    public function label(): string
    {
        return match ($this) {
            self::Assigned => 'Ditugaskan',
            self::InProgress => 'Sedang Dinilai',
            self::Completed => 'Selesai',
            self::Conflict => 'Konflik Kepentingan',
        };
    }
}
