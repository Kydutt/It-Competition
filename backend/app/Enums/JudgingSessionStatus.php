<?php

declare(strict_types=1);

namespace App\Enums;

enum JudgingSessionStatus: string
{
    case NotStarted = 'not_started';
    case InProgress = 'in_progress';
    case Submitted = 'submitted';
    case Locked = 'locked';

    public function label(): string
    {
        return match ($this) {
            self::NotStarted => 'Belum Dimulai',
            self::InProgress => 'Sedang Berlangsung',
            self::Submitted => 'Telah Disubmit',
            self::Locked => 'Terkunci',
        };
    }

    public function isEditable(): bool
    {
        return in_array($this, [self::NotStarted, self::InProgress], true);
    }
}
