<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegistrationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'registration_number' => $this->registration_number,
            'status' => $this->status?->value ?? $this->status,
            'registration_fee_snapshot' => $this->effectiveRegistrationFeeRupiah(),
            'fee_locked_at' => $this->fee_locked_at?->toISOString(),
            'notes' => $this->notes,
            'admin_notes' => $this->admin_notes,
            'submitted_at' => $this->submitted_at?->toISOString(),
            'verified_at' => $this->verified_at?->toISOString(),
            'competition' => new CompetitionResource($this->whenLoaded('competition')),
            'participant' => new UserResource($this->whenLoaded('participant')),
            'user' => new UserResource($this->whenLoaded('user') ?? $this->whenLoaded('participant')),
            'team' => new TeamResource($this->whenLoaded('team')),
            'documents' => RegistrationDocumentResource::collection($this->whenLoaded('documents')),
            'submissions' => SubmissionResource::collection($this->whenLoaded('submissions')),
            'latest_payment' => new PaymentResource($this->whenLoaded('latestPayment')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
