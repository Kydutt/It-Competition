<?php

declare(strict_types=1);

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class CreateRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'competition_id' => ['required', 'integer', 'exists:competitions,id'],
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
        ];
    }
}
