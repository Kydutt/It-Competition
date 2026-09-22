<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\RegistrationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class VerifyRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', new Enum(RegistrationStatus::class)],
            'notes' => ['nullable', 'string'],
        ];
    }
}
