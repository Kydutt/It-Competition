<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'registration_number' => $this->registration_number,
            'competition_id' => $this->competition_id,
            'competition' => new CompetitionResource($this->whenLoaded('competition')),
            'team_id' => $this->team_id,
            'team' => new TeamResource($this->whenLoaded('team')),
            'user_id' => $this->user_id,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'notes' => $this->notes,
            'verified_at' => $this->verified_at?->toISOString(),
            'payment' => new PaymentResource($this->whenLoaded('payment')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
