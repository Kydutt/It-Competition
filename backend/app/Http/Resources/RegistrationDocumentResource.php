<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegistrationDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'registration_id' => $this->registration_id,
            'document_type' => $this->document_type,
            'original_filename' => $this->original_filename,
            'mime_type' => $this->mime_type,
            'file_size' => $this->file_size,
            'verification_status' => $this->verification_status?->value ?? $this->verification_status,
            'verification_note' => $this->verification_note,
            'verified_at' => $this->verified_at?->toISOString(),
            'download_url' => url('/api/v1/participant/documents/' . $this->id . '/download'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
