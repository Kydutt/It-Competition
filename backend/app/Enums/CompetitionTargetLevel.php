<?php

declare(strict_types=1);

namespace App\Enums;

enum CompetitionTargetLevel: string
{
    case University = 'university';
    case HighSchool = 'high_school';

    public function label(): string
    {
        return match ($this) {
            self::University => 'Mahasiswa (Perguruan Tinggi)',
            self::HighSchool => 'Siswa (SMA / SMK / Sederajat)',
        };
    }

    /**
     * @return array<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
