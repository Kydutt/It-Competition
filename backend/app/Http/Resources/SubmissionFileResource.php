<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionFileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user()?->isAdmin() ?? false;
        $downloadUrl = $isAdmin
            ? url("/api/v1/admin/submissions/{$this->submission_id}/files/{$this->id}")
            : url("/api/v1/participant/submissions/{$this->submission_id}/files/{$this->id}");

        return [
            'id' => $this->id,
            'submission_id' => $this->submission_id,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'size_formatted' => $this->formatBytes((int) $this->size),
            'download_url' => $downloadUrl,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2).' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2).' KB';
        }

        return $bytes.' B';
    }
}
