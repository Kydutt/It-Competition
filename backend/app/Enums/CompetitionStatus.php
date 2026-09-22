<?php

declare(strict_types=1);

namespace App\Enums;

enum CompetitionStatus: string
{
    case Draft = 'draft';
    case RegistrationOpen = 'registration_open';
    case RegistrationClosed = 'registration_closed';
    case SubmissionOpen = 'submission_open';
    case Judging = 'judging';
    case Finished = 'finished';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::RegistrationOpen => 'Pendaftaran Dibuka',
            self::RegistrationClosed => 'Pendaftaran Ditutup',
            self::SubmissionOpen => 'Pengumpulan Karya Dibuka',
            self::Judging => 'Tahap Penjurian',
            self::Finished => 'Selesai',
            self::Archived => 'Diarsipkan',
        };
    }

    /**
     * Determine valid status transitions based on competition lifecycle rules.
     */
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
                self::RegistrationOpen,
                self::Archived,
            ],
            self::RegistrationOpen => [
                self::RegistrationClosed,
                self::Draft,
                self::Archived,
            ],
            self::RegistrationClosed => [
                self::SubmissionOpen,
                self::RegistrationOpen,
                self::Archived,
            ],
            self::SubmissionOpen => [
                self::Judging,
                self::RegistrationClosed,
                self::Archived,
            ],
            self::Judging => [
                self::Finished,
                self::SubmissionOpen,
                self::Archived,
            ],
            self::Finished => [
                self::Archived,
            ],
            self::Archived => [
                self::Draft,
            ],
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
