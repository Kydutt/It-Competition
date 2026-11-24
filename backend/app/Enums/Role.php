<?php

namespace App\Enums;

enum Role: string
{
    case PARTICIPANT = 'participant';
    case ADMIN = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::PARTICIPANT => 'Peserta',
            self::ADMIN => 'Administrator',
        };
    }
}
