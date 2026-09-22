<?php

declare(strict_types=1);

namespace App\Http\Requests\Judge;

use Illuminate\Foundation\Http\FormRequest;

class ScoreSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'submission_id' => ['required', 'exists:submissions,id'],
            'scores' => ['required', 'array', 'min:1'],
            'scores.*.judging_criteria_id' => ['required', 'exists:judging_criteria,id'],
            'scores.*.score' => ['required', 'numeric', 'min:0', 'max:100'],
            'scores.*.feedback' => ['nullable', 'string'],
        ];
    }
}
