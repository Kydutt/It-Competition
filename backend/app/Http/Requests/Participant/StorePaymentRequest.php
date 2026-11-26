<?php

declare(strict_types=1);

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Nominal, order_id, status, and gateway are determined strictly by the backend.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
