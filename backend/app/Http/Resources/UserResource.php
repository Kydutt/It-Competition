<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role?->value ?? $this->role,
            'is_active' => (bool) $this->is_active,
            'profile' => $this->whenLoaded('profile', function () {
                if (! $this->profile) {
                    return null;
                }
                return [
                    'phone' => $this->profile->phone,
                    'institution' => $this->profile->institution,
                    'education_level' => $this->profile->education_level,
                    'identity_number' => $this->profile->identity_number,
                    'address' => $this->profile->address,
                    'profile_photo_url' => $this->profile->profile_photo_path ? asset('storage/' . $this->profile->profile_photo_path) : null,
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
