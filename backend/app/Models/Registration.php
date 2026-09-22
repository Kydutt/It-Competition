<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RegistrationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Registration extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_number',
        'competition_id',
        'team_id',
        'user_id',
        'status',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
        'revision_note',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'status' => RegistrationStatus::class,
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Registration $registration) {
            if (empty($registration->registration_number)) {
                $registration->registration_number = static::generateRegistrationNumber();
            }
            if ($registration->status === null) {
                $registration->status = RegistrationStatus::Draft;
            }
        });
    }

    public static function generateRegistrationNumber(): string
    {
        $year = date('Y');
        $prefix = "ITC-{$year}-";

        $last = static::where('registration_number', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->value('registration_number');

        if ($last && preg_match('/-(\d+)$/', $last, $matches)) {
            $next = ((int) $matches[1]) + 1;
        } else {
            $next = 1;
        }

        do {
            $number = sprintf('%s%05d', $prefix, $next);
            $next++;
        } while (static::where('registration_number', $number)->exists());

        return $number;
    }

    public function isDraft(): bool
    {
        return $this->status === RegistrationStatus::Draft;
    }

    public function isSubmitted(): bool
    {
        return $this->status === RegistrationStatus::Submitted;
    }

    public function isApproved(): bool
    {
        return $this->status === RegistrationStatus::Approved;
    }

    public function isTeamBased(): bool
    {
        return $this->team_id !== null || ($this->competition && $this->competition->isTeamBased());
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [
            RegistrationStatus::Draft,
            RegistrationStatus::Submitted,
            RegistrationStatus::RevisionRequired,
        ], true);
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function isPaymentCleared(): bool
    {
        if ($this->competition && (int) $this->competition->registration_fee === 0) {
            return true;
        }

        return $this->payment?->isApproved() ?? false;
    }

    public function isEligibleForSubmission(): bool
    {
        return $this->isApproved() && $this->isPaymentCleared();
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function submission(): HasOne
    {
        return $this->hasOne(Submission::class);
    }
}
