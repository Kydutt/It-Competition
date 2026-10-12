<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\JudgingAudit;
use App\Models\User;

class JudgingAuditService
{
    /**
     * Record an immutable audit log entry for judging actions.
     */
    public function log(
        ?User $user,
        string $action,
        string $entityType,
        int|string|null $entityId = null,
        array $metadata = []
    ): JudgingAudit {
        return JudgingAudit::create([
            'user_id' => $user?->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'metadata' => $metadata,
        ]);
    }
}
