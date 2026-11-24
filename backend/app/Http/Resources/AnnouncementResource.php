<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class AnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'competition_id' => $this->competition_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content,
            'excerpt' => Str::limit(strip_tags($this->content), 160),
            'thumbnail_url' => $this->thumbnail_path ? asset('storage/' . $this->thumbnail_path) : null,
            'audience' => $this->audience?->value ?? $this->audience,
            'status' => $this->status?->value ?? $this->status,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'event_name' => $this->whenLoaded('event', fn () => $this->event?->name),
            'competition_name' => $this->whenLoaded('competition', fn () => $this->competition?->name),
        ];
    }
}
