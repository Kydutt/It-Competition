<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'registration_id' => Registration::factory(),
            'user_id' => User::factory(),
            'order_id' => 'ITC-PAY-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(5)),
            'gateway' => 'midtrans',
            'amount' => 100000.00,
            'payment_method' => null,
            'payment_type' => null,
            'snap_token' => Str::uuid()->toString(),
            'snap_redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/' . Str::uuid(),
            'status' => PaymentStatus::PENDING,
            'expired_at' => now()->addHours(24),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => PaymentStatus::PAID,
            'payment_type' => 'qris',
            'midtrans_transaction_id' => Str::uuid()->toString(),
            'midtrans_transaction_status' => 'settlement',
            'fraud_status' => 'accept',
            'paid_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => PaymentStatus::EXPIRED,
            'midtrans_transaction_status' => 'expire',
            'expired_at' => now()->subMinute(),
        ]);
    }
}
