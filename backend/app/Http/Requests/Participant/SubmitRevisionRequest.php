<?php

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class SubmitRevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'file' => ['nullable', 'file', 'mimes:pdf,zip,rar,tar,gz', 'max:25600'],
            'external_url' => ['nullable', 'url', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'revision_note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes' => 'Format file yang didukung: pdf, zip, rar, tar, gz.',
            'file.max' => 'Ukuran file maksimal 25 MB.',
            'external_url.url' => 'Format URL eksternal tidak valid.',
        ];
    }
}
