<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Participant = 'participant';
    case Admin = 'admin';
    case Judge = 'judge';

    public function label(): string
    {
        return match ($this) {
            self::Participant => 'Participant',
            self::Admin => 'Administrator',
            self::Judge => 'Judge',
        };
    }
}
