<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\RegistrationStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegistrationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->status instanceof RegistrationStatus ? $this->status : RegistrationStatus::tryFrom((string) $this->status);

        return [
            'id' => $this->id,
            'registration_number' => $this->registration_number,
            'competition_id' => $this->competition_id,
            'competition' => $this->whenLoaded('competition', function () {
                return [
                    'id' => $this->competition->id,
                    'title' => $this->competition->title,
                    'slug' => $this->competition->slug,
                    'competition_type' => $this->competition->competition_type?->value ?? $this->competition->competition_type,
                    'target_level' => $this->competition->target_level?->value ?? $this->competition->target_level,
                    'registration_fee' => (float) $this->competition->registration_fee,
                    'min_team_member' => $this->competition->min_team_member,
                    'max_team_member' => $this->competition->max_team_member,
                    'status' => $this->competition->status?->value ?? $this->competition->status,
                ];
            }),
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'phone' => $this->user->phone,
                    'institution' => $this->user->institution,
                    'education_level' => $this->user->education_level,
                ];
            }),
            'team_id' => $this->team_id,
            'team' => $this->whenLoaded('team', function () {
                return new TeamResource($this->team);
            }),
            'status' => $status?->value ?? (string) $this->status,
            'status_label' => $status?->label() ?? (string) $this->status,
            'is_team_based' => $this->isTeamBased(),
            'submitted_at' => $this->submitted_at?->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'reviewed_by' => $this->reviewed_by,
            'reviewer' => $this->whenLoaded('reviewer', function () {
                return [
                    'id' => $this->reviewer->id,
                    'name' => $this->reviewer->name,
                ];
            }),
            'rejection_reason' => $this->rejection_reason,
            'revision_note' => $this->revision_note,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
