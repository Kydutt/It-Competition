<?php

declare(strict_types=1);

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class PaymentProofRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'registration_id' => ['required', 'exists:registrations,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'string', 'max:50'],
            'proof_url' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
