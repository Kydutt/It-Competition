<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\PaymentStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->status instanceof PaymentStatus
            ? $this->status
            : PaymentStatus::tryFrom((string) $this->status);

        $user = $request->user();
        $canCheckout = $user !== null
            && $status === PaymentStatus::PENDING
            && ! $this->isExpired()
            && (
                $user->isAdmin()
                || $this->user_id === $user->id
                || ($this->relationLoaded('registration') && $this->registration?->participant_id === $user->id)
                || ($this->relationLoaded('registration') && $this->registration?->team?->leader_id === $user->id)
            );

        $sanitizedHistory = [];
        $cumulativeRefundedAmount = null;
        $netPaidAmount = null;

        if (is_array($this->webhook_payload)) {
            if (isset($this->webhook_payload['cumulative_refunded_amount']) && is_numeric($this->webhook_payload['cumulative_refunded_amount'])) {
                $cumulativeRefundedAmount = (float) $this->webhook_payload['cumulative_refunded_amount'];
            }

            if (array_key_exists('net_paid_amount', $this->webhook_payload) && is_numeric($this->webhook_payload['net_paid_amount'])) {
                $netPaidAmount = (float) $this->webhook_payload['net_paid_amount'];
            }

            if (is_array($this->webhook_payload['reversal_history'] ?? null)) {
                foreach ($this->webhook_payload['reversal_history'] as $entry) {
                    if (! is_array($entry)) {
                        continue;
                    }

                    $sanitizedHistory[] = [
                        'type' => $entry['type'] ?? null,
                        'refund_key' => $entry['refund_key'] ?? null,
                        'refund_chargeback_id' => $entry['refund_chargeback_id'] ?? null,
                        'refund_amount' => isset($entry['refund_amount']) && is_numeric($entry['refund_amount'])
                            ? (float) $entry['refund_amount']
                            : null,
                        'cumulative_refunded_amount' => isset($entry['cumulative_refunded_amount']) && is_numeric($entry['cumulative_refunded_amount'])
                            ? (float) $entry['cumulative_refunded_amount']
                            : null,
                        'net_paid_amount' => array_key_exists('net_paid_amount', $entry) && is_numeric($entry['net_paid_amount'])
                            ? (float) $entry['net_paid_amount']
                            : null,
                        'recorded_at' => $entry['recorded_at'] ?? null,
                        'source' => $entry['source'] ?? null,
                    ];
                }
            }
        }

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'registration_id' => $this->registration_id,
            'user_id' => $this->user_id,
            'gateway' => $this->gateway ?? 'midtrans',
            'amount' => (float) $this->amount,
            'payment_method' => $this->payment_method,
            'payment_type' => $this->payment_type,
            'status' => $status?->value ?? (string) $this->status,
            'status_label' => $status?->label() ?? (string) $this->status,
            'reversal_reason' => $this->rejection_reason,
            'cumulative_refunded_amount' => $cumulativeRefundedAmount,
            'net_paid_amount' => $netPaidAmount,
            'reversal_history' => $sanitizedHistory,
            'snap_token' => $this->when($canCheckout, $this->snap_token),
            'snap_redirect_url' => $this->when($canCheckout, $this->snap_redirect_url),
            'midtrans_transaction_id' => $this->midtrans_transaction_id,
            'midtrans_transaction_status' => $this->midtrans_transaction_status,
            'fraud_status' => $this->fraud_status,
            'paid_at' => $this->paid_at?->toISOString(),
            'expired_at' => $this->expired_at?->toISOString(),
            'registration' => $this->whenLoaded('registration', function () {
                return [
                    'id' => $this->registration->id,
                    'registration_number' => $this->registration->registration_number,
                    'status' => $this->registration->status?->value ?? (string) $this->registration->status,
                    'registration_fee_snapshot' => $this->registration->effectiveRegistrationFeeRupiah(),
                    'fee_locked_at' => $this->registration->fee_locked_at?->toISOString(),
                    'competition' => $this->registration->competition ? [
                        'id' => $this->registration->competition->id,
                        'event_id' => $this->registration->competition->event_id,
                        'name' => $this->registration->competition->name,
                        'slug' => $this->registration->competition->slug,
                        'registration_fee' => (float) $this->registration->competition->registration_fee,
                        'registration_deadline' => $this->registration->competition->registration_deadline?->toISOString(),
                    ] : null,
                    'team' => $this->registration->team ? [
                        'id' => $this->registration->team->id,
                        'name' => $this->registration->team->name,
                        'team_code' => $this->registration->team->team_code,
                        'leader_id' => $this->registration->team->leader_id,
                    ] : null,
                ];
            }),
            'payer' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
