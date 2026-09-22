<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\CompetitionTargetLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreCompetitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('min_team_members') && ! $this->has('min_team_member')) {
            $merge['min_team_member'] = $this->input('min_team_members');
        }

        if ($this->has('max_team_members') && ! $this->has('max_team_member')) {
            $merge['max_team_member'] = $this->input('max_team_members');
        }

        if ($this->has('submission_end') && ! $this->has('submission_deadline')) {
            $merge['submission_deadline'] = $this->input('submission_end');
        }

        if ($this->has('is_active') && ! $this->has('is_published')) {
            $merge['is_published'] = $this->boolean('is_active');
        }

        if (! empty($merge)) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:competitions,slug'],
            'category' => ['required', new Enum(CompetitionCategory::class)],
            'description' => ['required', 'string'],
            'theme' => ['nullable', 'string', 'max:255'],
            'target_level' => ['required', new Enum(CompetitionTargetLevel::class)],
            'registration_fee' => ['required', 'integer', 'min:0'],
            'quota' => ['required', 'integer', 'min:1'],
            'min_team_member' => ['required', 'integer', 'min:1'],
            'max_team_member' => ['required', 'integer', 'gte:min_team_member'],
            'registration_start' => ['nullable', 'date'],
            'registration_end' => ['nullable', 'date', 'after:registration_start'],
            'submission_start' => ['nullable', 'date'],
            'submission_deadline' => ['nullable', 'date', 'after:submission_start'],
            'status' => ['nullable', new Enum(CompetitionStatus::class)],
            'is_published' => ['nullable', 'boolean'],
            'guidebook_url' => ['nullable', 'string', 'max:255'],
            'poster_url' => ['nullable', 'string', 'max:255'],
        ];
    }
}
