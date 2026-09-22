<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Menunggu Pembayaran',
            self::Submitted => 'Bukti Diunggah',
            self::UnderReview => 'Sedang Ditinjau Panitia',
            self::Approved => 'Pembayaran Disetujui',
            self::Rejected => 'Pembayaran Ditolak',
            self::Cancelled => 'Dibatalkan',
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return match ($this) {
            self::Pending => in_array($target, [self::Submitted, self::Cancelled], true),
            self::Submitted => in_array($target, [self::UnderReview, self::Approved, self::Rejected, self::Cancelled], true),
            self::UnderReview => in_array($target, [self::Approved, self::Rejected], true),
            self::Rejected => in_array($target, [self::Submitted, self::Cancelled], true),
            self::Approved, self::Cancelled => false,
        };
    }
}
