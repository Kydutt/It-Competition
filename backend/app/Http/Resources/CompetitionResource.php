<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompetitionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'cover_image_url' => $this->cover_image_path ? asset('storage/' . $this->cover_image_path) : null,
            'eligibility' => $this->eligibility,
            'registration_type' => $this->registration_type?->value ?? $this->registration_type,
            'min_members' => $this->min_members,
            'max_members' => $this->max_members,
            'registration_fee' => (float) $this->registration_fee,
            'registration_start' => $this->registration_start?->toISOString(),
            'registration_deadline' => $this->registration_deadline?->toISOString(),
            'submission_deadline' => $this->submission_deadline?->toISOString(),
            'status' => $this->status?->value ?? $this->status,
            'category' => new CompetitionCategoryResource($this->whenLoaded('category')),
            'contact_information' => $this->contact_information,
        ];
    }
}
