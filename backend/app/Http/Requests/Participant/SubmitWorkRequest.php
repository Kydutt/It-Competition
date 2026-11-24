<?php

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class SubmitWorkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'registration_id' => ['required', 'exists:registrations,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'file' => ['nullable', 'file', 'mimes:zip,pdf', 'max:51200'], // max 50 MB
            'external_url' => ['nullable', 'url', 'max:500'],
            'repository_url' => ['nullable', 'url', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'registration_id.required' => 'Nomor registrasi kompetisi wajib disertakan.',
            'title.required' => 'Judul karya kompetisi wajib diisi.',
            'file.mimes' => 'Berkas karya hanya boleh berformat ZIP atau PDF.',
            'file.max' => 'Ukuran berkas karya maksimal 50 MB.',
            'external_url.url' => 'Tautan eksternal harus berupa URL yang valid.',
            'repository_url.url' => 'Tautan repositori harus berupa URL yang valid.',
        ];
    }
}
