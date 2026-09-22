<?php

declare(strict_types=1);

namespace App\Enums;

enum RegistrationStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case RevisionRequired = 'revision_required';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft (Penyusunan)',
            self::Submitted => 'Menunggu Verifikasi',
            self::UnderReview => 'Sedang Ditinjau',
            self::RevisionRequired => 'Perlu Revisi',
            self::Approved => 'Disetujui',
            self::Rejected => 'Ditolak',
            self::Cancelled => 'Dibatalkan',
        };
    }

    public function canTransitionTo(self $target): bool
    {
        if ($this === $target) {
            return true;
        }

        return in_array($target, $this->allowedTransitions(), true);
    }

    /**
     * @return array<self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [
                self::Submitted,
                self::Cancelled,
            ],
            self::Submitted => [
                self::UnderReview,
                self::Cancelled,
            ],
            self::UnderReview => [
                self::Approved,
                self::Rejected,
                self::RevisionRequired,
            ],
            self::RevisionRequired => [
                self::Submitted,
                self::Cancelled,
            ],
            self::Approved => [],
            self::Rejected => [],
            self::Cancelled => [],
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
