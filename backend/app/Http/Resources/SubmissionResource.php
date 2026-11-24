<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'registration_id' => $this->registration_id,
            'registration_number' => $this->whenLoaded('registration', fn () => $this->registration?->registration_number),
            'competition_name' => $this->whenLoaded('registration', fn () => $this->registration?->competition?->name),
            'title' => $this->title,
            'description' => $this->description,
            'file_url' => $this->file_path ? asset('storage/' . $this->file_path) : null,
            'external_url' => $this->external_url,
            'repository_url' => $this->repository_url,
            'status' => $this->status?->value ?? $this->status,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'review_note' => $this->review_note,
            'revisions' => $this->whenLoaded('revisions', function () {
                return $this->revisions->map(fn ($rev) => [
                    'id' => $rev->id,
                    'file_url' => $rev->file_path ? asset('storage/' . $rev->file_path) : null,
                    'external_url' => $rev->external_url,
                    'revision_note' => $rev->revision_note,
                    'submitted_at' => $rev->submitted_at?->toISOString(),
                ]);
            }),
            'revisions_count' => $this->whenCounted('revisions'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
