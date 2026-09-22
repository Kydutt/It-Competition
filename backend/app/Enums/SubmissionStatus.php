<?php

declare(strict_types=1);

namespace App\Enums;

enum SubmissionStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case Locked = 'locked';
    case Withdrawn = 'withdrawn';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf Karya',
            self::Submitted => 'Karya Diajukan',
            self::Locked => 'Karya Terkunci (Selesai)',
            self::Withdrawn => 'Ditarik Kembali',
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return match ($this) {
            self::Draft => in_array($target, [self::Submitted, self::Withdrawn], true),
            self::Submitted => in_array($target, [self::Locked, self::Withdrawn, self::Draft], true),
            self::Locked => false,
            self::Withdrawn => in_array($target, [self::Draft, self::Submitted], true),
        };
    }
}
