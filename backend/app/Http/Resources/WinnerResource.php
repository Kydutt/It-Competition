<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WinnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'competition_id' => $this->competition_id,
            'competition_name' => $this->competition?->name,
            'team_id' => $this->team_id,
            'team_name' => $this->team?->name,
            'institution' => $this->team?->institution,
            'title' => $this->title,
            'rank' => (int) $this->rank,
            'prize' => $this->prize,
            'certificate_url' => $this->certificate_url,
        ];
    }
}
