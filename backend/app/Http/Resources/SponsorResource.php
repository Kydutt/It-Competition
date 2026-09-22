<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SponsorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'logo_url' => $this->logo_url,
            'tier' => $this->tier,
            'website_url' => $this->website_url,
            'order' => (int) $this->order,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
