<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\TeamMemberRole;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamMemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $role = $this->role instanceof TeamMemberRole ? $this->role : TeamMemberRole::tryFrom((string) $this->role);

        return [
            'id' => $this->id,
            'team_id' => $this->team_id,
            'user_id' => $this->user_id,
            'name' => $this->user?->name,
            'email' => $this->user?->email,
            'phone' => $this->user?->phone,
            'education_level' => $this->user?->education_level,
            'institution' => $this->user?->institution,
            'role' => $role?->value ?? (string) $this->role,
            'role_label' => $role?->label() ?? (string) $this->role,
            'joined_at' => $this->joined_at?->toISOString(),
        ];
    }
}
