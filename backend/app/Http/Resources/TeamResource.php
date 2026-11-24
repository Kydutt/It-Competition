<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'team_code' => $this->team_code,
            'leader' => new UserResource($this->whenLoaded('leader')),
            'members' => $this->whenLoaded('members', function () {
                return $this->members->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role?->value ?? $user->role,
                        'member_role' => $user->pivot?->member_role ?? ($user->id === $this->leader_id ? 'leader' : 'member'),
                        'profile' => $user->relationLoaded('profile') && $user->profile ? [
                            'institution' => $user->profile->institution,
                            'phone' => $user->profile->phone,
                            'phone_number' => $user->profile->phone,
                            'education_level' => $user->profile->education_level,
                            'profile_photo_url' => $user->profile->profile_photo_path ? asset('storage/' . $user->profile->profile_photo_path) : null,
                        ] : null,
                        'user' => [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'profile' => $user->relationLoaded('profile') && $user->profile ? [
                                'institution' => $user->profile->institution,
                                'phone' => $user->profile->phone,
                                'phone_number' => $user->profile->phone,
                            ] : null,
                        ],
                    ];
                });
            }),
            'members_count' => $this->whenCounted('members'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
