<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_id',
        'user_id',
        'order_id',
        'gateway',
        'amount',
        'payment_method',
        'payment_type',
        'snap_token',
        'snap_redirect_url',
        'midtrans_transaction_id',
        'midtrans_transaction_status',
        'fraud_status',
        'status',
        'paid_at',
        'expired_at',
        'webhook_payload',
        'last_webhook_at',
        'payment_proof_path',
        'rejection_reason',
        'verified_by',
        'verified_at',
    ];

    protected $hidden = [
        'webhook_payload',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'status' => PaymentStatus::class,
            'paid_at' => 'datetime',
            'expired_at' => 'datetime',
            'last_webhook_at' => 'datetime',
            'verified_at' => 'datetime',
            'webhook_payload' => 'array',
        ];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function isPaid(): bool
    {
        return $this->status instanceof PaymentStatus && $this->status->isPaid();
    }

    public function isExpired(): bool
    {
        if ($this->status === PaymentStatus::EXPIRED) {
            return true;
        }

        return $this->status === PaymentStatus::PENDING
            && $this->expired_at !== null
            && $this->expired_at->isPast();
    }
}
