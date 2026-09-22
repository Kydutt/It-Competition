<?php

declare(strict_types=1);

namespace App\Http\Requests\Participant;

use Illuminate\Foundation\Http\FormRequest;

class JoinTeamRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:50'],
        ];
    }
}
