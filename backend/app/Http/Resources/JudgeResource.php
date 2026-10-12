<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JudgeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'judge_code' => $this->judge_code,
            'bio' => $this->bio,
            'institution' => $this->institution,
            'is_active' => $this->is_active,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ]),
            'assignments_count' => $this->whenCounted('assignments', $this->assignments_count ?? $this->assignments?->count()),
            'completed_count' => $this->when(
                $this->relationLoaded('assignments'),
                fn () => $this->assignments->where('status', 'completed')->count()
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
