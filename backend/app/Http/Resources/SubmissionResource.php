<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\SubmissionStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->status instanceof SubmissionStatus ? $this->status : SubmissionStatus::tryFrom((string) $this->status);

        return [
            'id' => $this->id,
            'registration_id' => $this->registration_id,
            'registration' => $this->whenLoaded('registration', function () {
                return [
                    'id' => $this->registration->id,
                    'registration_number' => $this->registration->registration_number,
                    'status' => $this->registration->status?->value ?? (string) $this->registration->status,
                    'user' => [
                        'id' => $this->registration->user?->id,
                        'name' => $this->registration->user?->name,
                        'email' => $this->registration->user?->email,
                    ],
                ];
            }),
            'competition_id' => $this->competition_id,
            'competition' => $this->whenLoaded('competition', function () {
                $deadline = $this->competition->submission_deadline;
                $isPassed = $deadline ? now()->gt($deadline) : false;

                return [
                    'id' => $this->competition->id,
                    'title' => $this->competition->title ?? $this->competition->name,
                    'slug' => $this->competition->slug,
                    'submission_start' => $this->competition->submission_start?->toISOString(),
                    'submission_deadline' => $deadline?->toISOString(),
                    'is_deadline_passed' => $isPassed,
                ];
            }),
            'team_id' => $this->team_id,
            'team' => $this->whenLoaded('team', function () {
                return [
                    'id' => $this->team->id,
                    'name' => $this->team->name,
                    'code' => $this->team->code,
                    'leader' => [
                        'id' => $this->team->leader?->id,
                        'name' => $this->team->leader?->name,
                    ],
                ];
            }),
            'title' => $this->title,
            'description' => $this->description,
            'status' => $status?->value ?? (string) $this->status,
            'status_label' => $status?->label() ?? (string) $this->status,
            'is_locked' => $this->isLocked(),
            'can_modify' => $this->canBeModified(),
            'files_count' => $this->files_count ?? $this->files()->count(),
            'files' => SubmissionFileResource::collection($this->whenLoaded('files')),
            'submitted_at' => $this->submitted_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
