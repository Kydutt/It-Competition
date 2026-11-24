<?php

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class CreateRegistrationDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'competition_id' => ['required', 'exists:competitions,id'],
            'team_id' => ['nullable', 'exists:teams,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'competition_id.required' => 'Cabang kompetisi wajib dipilih.',
            'competition_id.exists' => 'Cabang kompetisi tidak valid.',
            'team_id.exists' => 'Data tim tidak ditemukan.',
        ];
    }
}
