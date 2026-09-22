<?php

declare(strict_types=1);

namespace App\Enums;

enum CompetitionType: string
{
    case Team = 'team';
    case Individual = 'individual';

    public function label(): string
    {
        return match ($this) {
            self::Team => 'Beregu (Tim)',
            self::Individual => 'Individu (Perorangan)',
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
