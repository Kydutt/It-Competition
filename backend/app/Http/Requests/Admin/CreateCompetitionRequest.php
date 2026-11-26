<?php

namespace App\Http\Requests\Admin;

use App\Enums\CompetitionStatus;
use App\Enums\RegistrationType;
use App\Support\MoneyHelper;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class CreateCompetitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $rawFee = $this->input('registration_fee');

        if (! $this->exists('registration_fee') || $rawFee === null || (is_string($rawFee) && trim($rawFee) === '')) {
            $this->merge(['registration_fee' => 0]);

            return;
        }

        if (is_string($rawFee)) {
            $this->merge(['registration_fee' => trim($rawFee)]);
        }
    }

    public function rules(): array
    {
        return [
            'event_id' => ['required', 'exists:events,id'],
            'category_id' => ['required', 'exists:competition_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:competitions,slug'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['required', 'string'],
            'cover_image_path' => ['nullable', 'string', 'max:255'],
            'eligibility' => ['nullable', 'string'],
            'registration_type' => ['required', new Enum(RegistrationType::class)],
            'min_members' => ['nullable', 'integer', 'min:1'],
            'max_members' => ['nullable', 'integer', 'gte:min_members'],
            'registration_fee' => ['required', 'integer', 'min:0', 'max:' . MoneyHelper::MAX_COMPETITION_FEE_RUPIAH],
            'registration_start' => ['required', 'date'],
            'registration_deadline' => ['required', 'date', 'after_or_equal:registration_start'],
            'submission_deadline' => ['nullable', 'date', 'after_or_equal:registration_deadline'],
            'status' => ['nullable', new Enum(CompetitionStatus::class)],
            'guidebook_path' => ['nullable', 'string', 'max:255'],
            'contact_information' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'registration_fee.integer' => 'Biaya pendaftaran harus berupa bilangan bulat Rupiah tanpa desimal.',
            'registration_fee.min' => 'Biaya pendaftaran minimal Rp0 (Gratis) dan tidak boleh bernilai negatif.',
            'registration_fee.max' => 'Biaya pendaftaran melebihi batas maksimal yang diizinkan.',
        ];
    }
}
