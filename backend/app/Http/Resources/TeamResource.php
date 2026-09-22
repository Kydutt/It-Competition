<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'competition_id' => $this->competition_id,
            'competition' => new CompetitionResource($this->whenLoaded('competition')),
            'leader_id' => $this->leader_id,
            'leader' => new UserResource($this->whenLoaded('leader')),
            'name' => $this->name,
            'code' => $this->code,
            'institution' => $this->institution,
            'status' => $this->status,
            'members' => $this->whenLoaded('members', function () {
                return $this->members->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'phone' => $member->phone,
                        'role' => $member->role instanceof \BackedEnum ? $member->role->value : $member->role,
                        'student_card_url' => $member->student_card_url,
                    ];
                });
            }),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
