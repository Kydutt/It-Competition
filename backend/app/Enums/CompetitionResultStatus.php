<?php

declare(strict_types=1);

namespace App\Enums;

enum CompetitionResultStatus: string
{
    case Pending = 'pending';
    case Finalist = 'finalist';
    case Winner = 'winner';
    case RunnerUp = 'runner_up';
    case HonorableMention = 'honorable_mention';
    case Disqualified = 'disqualified';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Menunggu',
            self::Finalist => 'Finalis',
            self::Winner => 'Juara',
            self::RunnerUp => 'Runner Up',
            self::HonorableMention => 'Penghargaan Khusus',
            self::Disqualified => 'Didiskualifikasi',
        };
    }
}
