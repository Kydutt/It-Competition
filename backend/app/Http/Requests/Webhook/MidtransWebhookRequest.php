<?php

declare(strict_types=1);

namespace App\Http\Requests\Webhook;

use Illuminate\Foundation\Http\FormRequest;

class MidtransWebhookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('refund_chargeback_id') && is_int($this->input('refund_chargeback_id'))) {
            $this->merge([
                'refund_chargeback_id' => (string) $this->input('refund_chargeback_id'),
            ]);
        }
    }

    /**
     * Validate structural Midtrans webhook notification fields.
     * Authentication is enforced via SHA-512 signature_key verification.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'order_id' => ['required', 'string', 'max:100'],
            'status_code' => ['required', 'string', 'max:20'],
            'gross_amount' => ['required', 'string', 'max:30'],
            'signature_key' => ['required', 'string', 'max:255'],
            'transaction_status' => ['required', 'string', 'max:50'],
            'fraud_status' => ['nullable', 'string', 'max:30'],
            'payment_type' => ['nullable', 'string', 'max:50'],
            'transaction_id' => ['nullable', 'string', 'max:100'],
            'currency' => ['nullable', 'string', 'max:10'],
            'status_message' => ['nullable', 'string', 'max:255'],
            'transaction_time' => ['nullable', 'string', 'max:50'],
            'settlement_time' => ['nullable', 'string', 'max:50'],
            'expiry_time' => ['nullable', 'string', 'max:50'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
            'refund_key' => ['nullable', 'string', 'max:100'],
            'refund_chargeback_id' => ['nullable', 'string', 'max:100'],
        ];
    }
}
