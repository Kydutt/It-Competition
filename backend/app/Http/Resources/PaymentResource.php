<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\PaymentStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->status instanceof PaymentStatus ? $this->status : PaymentStatus::tryFrom((string) $this->status);
        $isAdmin = $request->user()?->isAdmin() ?? false;
        $proofDownloadRoute = $isAdmin
            ? url("/api/v1/admin/payments/{$this->id}/proof")
            : url("/api/v1/participant/payments/{$this->id}/proof");

        return [
            'id' => $this->id,
            'registration_id' => $this->registration_id,
            'registration' => $this->whenLoaded('registration', function () {
                return [
                    'id' => $this->registration->id,
                    'registration_number' => $this->registration->registration_number,
                    'status' => $this->registration->status?->value ?? (string) $this->registration->status,
                    'competition' => [
                        'id' => $this->registration->competition?->id,
                        'title' => $this->registration->competition?->title ?? $this->registration->competition?->name,
                        'registration_fee' => (int) ($this->registration->competition?->registration_fee ?? 0),
                    ],
                    'team' => $this->registration->team ? [
                        'id' => $this->registration->team->id,
                        'name' => $this->registration->team->name,
                        'code' => $this->registration->team->code,
                    ] : null,
                ];
            }),
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ];
            }),
            'amount' => (int) $this->amount,
            'payment_method' => $this->payment_method,
            'status' => $status?->value ?? (string) $this->status,
            'status_label' => $status?->label() ?? (string) $this->status,
            'has_proof' => ! empty($this->proof_path),
            'proof_url' => ! empty($this->proof_path) ? $proofDownloadRoute : null,
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
            'bank_info' => config('payment'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
