<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case PENDING = 'pending';
    case PAID = 'paid';
    case EXPIRED = 'expired';
    case CANCELLED = 'cancelled';
    case FAILED = 'failed';
    case VERIFIED = 'verified';
    case REJECTED = 'rejected';

    public function isPaid(): bool
    {
        return in_array($this, [self::PAID, self::VERIFIED], true);
    }

    public function isFinal(): bool
    {
        return in_array($this, [
            self::PAID,
            self::VERIFIED,
            self::EXPIRED,
            self::CANCELLED,
            self::FAILED,
            self::REJECTED,
        ], true);
    }

    public function isRetryable(): bool
    {
        return in_array($this, [
            self::EXPIRED,
            self::CANCELLED,
            self::FAILED,
            self::REJECTED,
        ], true);
    }

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Menunggu Pembayaran',
            self::PAID => 'Lunas',
            self::EXPIRED => 'Kedaluwarsa',
            self::CANCELLED => 'Dibatalkan',
            self::FAILED => 'Gagal',
            self::VERIFIED => 'Terverifikasi',
            self::REJECTED => 'Ditolak',
        };
    }
}
