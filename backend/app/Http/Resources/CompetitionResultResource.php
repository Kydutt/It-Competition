<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompetitionResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'competition_id' => $this->competition_id,
            'registration_id' => $this->registration_id,
            'final_score' => $this->final_score,
            'rank' => $this->rank,
            'result_status' => $this->result_status?->value ?? $this->result_status,
            'result_status_label' => $this->result_status instanceof \App\Enums\CompetitionResultStatus ? $this->result_status->label() : $this->result_status,
            'notes' => $this->when($request->user()?->isAdmin(), $this->notes),
            'published_at' => $this->published_at?->toISOString(),
            'registration' => $this->whenLoaded('registration', fn () => [
                'id' => $this->registration->id,
                'registration_number' => $this->registration->registration_number,
                'user' => $this->registration->user ? [
                    'id' => $this->registration->user->id,
                    'name' => $this->registration->user->name,
                    'institution' => $this->registration->user->institution,
                ] : null,
                'team' => $this->registration->team ? [
                    'id' => $this->registration->team->id,
                    'name' => $this->registration->team->name,
                    'leader' => $this->registration->team->leader ? [
                        'id' => $this->registration->team->leader->id,
                        'name' => $this->registration->team->leader->name,
                        'institution' => $this->registration->team->leader->institution,
                    ] : null,
                ] : null,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
