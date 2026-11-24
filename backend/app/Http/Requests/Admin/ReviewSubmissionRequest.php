<?php

namespace App\Http\Requests\Admin;

use App\Enums\SubmissionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class ReviewSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', new Enum(SubmissionStatus::class)],
            'notes' => ['nullable', 'string', 'max:1000'],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $status = $this->input('status');
            $notes = trim((string) ($this->input('notes') ?? $this->input('admin_notes') ?? ''));

            if (in_array($status, [SubmissionStatus::REVISION_REQUIRED->value, SubmissionStatus::REJECTED->value], true)) {
                if ($notes === '') {
                    $validator->errors()->add('notes', 'Catatan alasan wajib diisi saat meminta revisi atau menolak karya.');
                }
            }
        });
    }
}
