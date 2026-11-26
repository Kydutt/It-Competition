<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Support\MoneyHelper;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Registration extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_number',
        'competition_id',
        'participant_id',
        'team_id',
        'status',
        'registration_fee_snapshot',
        'fee_locked_at',
        'notes',
        'admin_notes',
        'submitted_at',
        'verified_at',
        'verified_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => RegistrationStatus::class,
            'registration_fee_snapshot' => 'decimal:2',
            'fee_locked_at' => 'datetime',
            'submitted_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_id');
    }

    public function user(): BelongsTo
    {
        return $this->participant();
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(RegistrationDocument::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function latestSubmission(): HasOne
    {
        return $this->hasOne(Submission::class)->latestOfMany();
    }

    public function submission(): HasOne
    {
        return $this->latestSubmission();
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function latestPayment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function hasPaidPayment(): bool
    {
        if ($this->relationLoaded('payments')) {
            return $this->payments->contains(fn (Payment $payment) => $payment->isPaid());
        }

        return $this->payments()
            ->whereIn('status', [PaymentStatus::PAID->value, PaymentStatus::VERIFIED->value])
            ->exists();
    }

    public function hasFeeSnapshot(): bool
    {
        return $this->registration_fee_snapshot !== null;
    }

    /**
     * Exact whole-Rupiah registration fee locked at registration creation.
     * Returns null when the registration snapshot is unresolved (ambiguous legacy row).
     */
    public function effectiveRegistrationFeeRupiah(): ?int
    {
        $raw = $this->registration_fee_snapshot;
        if ($raw === null) {
            return null;
        }

        return MoneyHelper::parseWholeRupiahStrict((string) $raw);
    }

    /**
     * Canonical DECIMAL(12,2) string representation of the locked registration fee.
     */
    public function effectiveRegistrationFeeDecimal(): ?string
    {
        $rupiah = $this->effectiveRegistrationFeeRupiah();

        return $rupiah === null ? null : MoneyHelper::rupiahToDecimalString($rupiah);
    }
}
