<?php

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama tim wajib diisi.',
            'name.min' => 'Nama tim minimal 3 karakter.',
            'name.max' => 'Nama tim maksimal 100 karakter.',
        ];
    }
}
