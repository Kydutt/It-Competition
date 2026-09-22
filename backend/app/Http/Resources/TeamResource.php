<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'competition_id' => $this->competition_id,
            'competition' => $this->whenLoaded('competition', function () {
                return [
                    'id' => $this->competition->id,
                    'title' => $this->competition->title,
                    'slug' => $this->competition->slug,
                    'competition_type' => $this->competition->competition_type?->value ?? $this->competition->competition_type,
                    'target_level' => $this->competition->target_level?->value ?? $this->competition->target_level,
                    'min_team_member' => $this->competition->min_team_member,
                    'max_team_member' => $this->competition->max_team_member,
                    'status' => $this->competition->status?->value ?? $this->competition->status,
                ];
            }),
            'name' => $this->name,
            'code' => $this->code,
            'institution' => $this->institution,
            'leader_id' => $this->leader_id,
            'leader' => $this->whenLoaded('leader', function () {
                return [
                    'id' => $this->leader->id,
                    'name' => $this->leader->name,
                    'email' => $this->leader->email,
                    'phone' => $this->leader->phone,
                    'institution' => $this->leader->institution,
                    'education_level' => $this->leader->education_level,
                ];
            }),
            'members_count' => $this->members_count ?? $this->members()->count(),
            'members' => TeamMemberResource::collection($this->whenLoaded('members')),
            'is_locked' => $this->isLocked(),
            'registration' => $this->whenLoaded('registration', function () {
                return [
                    'id' => $this->registration->id,
                    'registration_number' => $this->registration->registration_number,
                    'status' => $this->registration->status?->value ?? $this->registration->status,
                    'status_label' => $this->registration->status?->label() ?? (string) $this->registration->status,
                    'submitted_at' => $this->registration->submitted_at?->toISOString(),
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
