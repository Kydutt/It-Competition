<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'competition_id' => $this->competition_id,
            'competition' => new CompetitionResource($this->whenLoaded('competition')),
            'team_id' => $this->team_id,
            'team' => new TeamResource($this->whenLoaded('team')),
            'title' => $this->title,
            'description' => $this->description,
            'file_url' => $this->file_url,
            'demo_url' => $this->demo_url,
            'repository_url' => $this->repository_url,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'notes' => $this->notes,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'scores_count' => $this->whenCounted('scores'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
