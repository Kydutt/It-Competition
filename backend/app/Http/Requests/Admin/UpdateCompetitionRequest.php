<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\CompetitionTargetLevel;
use App\Models\Competition;
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
        /** @var Competition|string|int|null $competition */
        $competition = $this->route('competition');
        $competitionId = $competition instanceof Competition ? $competition->id : $competition;

        $minTeamMember = $this->input('min_team_member')
            ?? ($competition instanceof Competition ? $competition->min_team_member : 1);

        $regStart = $this->input('registration_start')
            ?? ($competition instanceof Competition && $competition->registration_start ? $competition->registration_start->toDateTimeString() : null);

        $subStart = $this->input('submission_start')
            ?? ($competition instanceof Competition && $competition->submission_start ? $competition->submission_start->toDateTimeString() : null);

        $regEndRules = ['nullable', 'date'];
        if ($regStart) {
            $regEndRules[] = 'after:'.$regStart;
        }

        $subDeadlineRules = ['nullable', 'date'];
        if ($subStart) {
            $subDeadlineRules[] = 'after:'.$subStart;
        }

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('competitions', 'slug')->ignore($competitionId)],
            'category' => ['sometimes', 'required', new Enum(CompetitionCategory::class)],
            'description' => ['sometimes', 'required', 'string'],
            'theme' => ['nullable', 'string', 'max:255'],
            'target_level' => ['sometimes', 'required', new Enum(CompetitionTargetLevel::class)],
            'registration_fee' => ['sometimes', 'required', 'integer', 'min:0'],
            'quota' => ['sometimes', 'required', 'integer', 'min:1'],
            'min_team_member' => ['sometimes', 'required', 'integer', 'min:1'],
            'max_team_member' => ['sometimes', 'required', 'integer', 'gte:'.$minTeamMember],
            'registration_start' => ['nullable', 'date'],
            'registration_end' => $regEndRules,
            'submission_start' => ['nullable', 'date'],
            'submission_deadline' => $subDeadlineRules,
            'status' => ['sometimes', 'nullable', new Enum(CompetitionStatus::class)],
            'is_published' => ['sometimes', 'nullable', 'boolean'],
            'guidebook_url' => ['nullable', 'string', 'max:255'],
            'poster_url' => ['nullable', 'string', 'max:255'],
        ];
    }
}
