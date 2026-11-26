<?php

namespace App\Http\Requests\Admin;

use App\Enums\CompetitionStatus;
use App\Enums\RegistrationType;
use App\Support\MoneyHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateCompetitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->exists('registration_fee') && is_string($this->input('registration_fee'))) {
            $trimmed = trim($this->input('registration_fee'));
            $this->merge(['registration_fee' => $trimmed === '' ? null : $trimmed]);
        }
    }

    public function rules(): array
    {
        $competitionId = $this->route('competition')?->id ?? $this->route('id');

        return [
            'event_id' => ['sometimes', 'required', 'exists:events,id'],
            'category_id' => ['sometimes', 'required', 'exists:competition_categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('competitions', 'slug')->ignore($competitionId)],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['sometimes', 'required', 'string'],
            'cover_image_path' => ['nullable', 'string', 'max:255'],
            'eligibility' => ['nullable', 'string'],
            'registration_type' => ['sometimes', 'required', new Enum(RegistrationType::class)],
            'min_members' => ['nullable', 'integer', 'min:1'],
            'max_members' => ['nullable', 'integer', 'gte:min_members'],
            'registration_fee' => ['sometimes', 'required', 'integer', 'min:0', 'max:' . MoneyHelper::MAX_COMPETITION_FEE_RUPIAH],
            'registration_start' => ['sometimes', 'required', 'date'],
            'registration_deadline' => ['sometimes', 'required', 'date', 'after_or_equal:registration_start'],
            'submission_deadline' => ['nullable', 'date', 'after_or_equal:registration_deadline'],
            'status' => ['nullable', new Enum(CompetitionStatus::class)],
            'guidebook_path' => ['nullable', 'string', 'max:255'],
            'contact_information' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'registration_fee.required' => 'Biaya pendaftaran wajib diisi (gunakan 0 untuk kompetisi gratis).',
            'registration_fee.integer' => 'Biaya pendaftaran harus berupa bilangan bulat Rupiah tanpa desimal.',
            'registration_fee.min' => 'Biaya pendaftaran minimal Rp0 (Gratis) dan tidak boleh bernilai negatif.',
            'registration_fee.max' => 'Biaya pendaftaran melebihi batas maksimal yang diizinkan.',
        ];
    }
}
