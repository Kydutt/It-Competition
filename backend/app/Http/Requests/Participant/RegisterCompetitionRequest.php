<?php

declare(strict_types=1);

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class RegisterCompetitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'competition_id' => ['required', 'exists:competitions,id'],
            'team_id' => ['required', 'exists:teams,id'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
