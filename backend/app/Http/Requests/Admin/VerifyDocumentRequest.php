<?php

namespace App\Http\Requests\Admin;

use App\Enums\DocumentVerificationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class VerifyDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', new Enum(DocumentVerificationStatus::class)],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
