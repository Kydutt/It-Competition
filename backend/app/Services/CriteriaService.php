<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Competition;
use App\Models\JudgingCriteria;
use App\Models\Score;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CriteriaService
{
    public function __construct(
        protected JudgingAuditService $auditService
    ) {}

    /**
     * Get all criteria for a competition, ordered by sort_order.
     */
    public function getForCompetition(Competition $competition): Collection
    {
        return $competition->judgingCriteria()->orderBy('sort_order')->get();
    }

    /**
     * Check if judging has started for a competition (any scores recorded).
     */
    public function hasJudgingStarted(Competition $competition): bool
    {
        return Score::whereHas('judgingCriteria', function ($q) use ($competition) {
            $q->where('competition_id', $competition->id);
        })->exists();
    }

    /**
     * Validate that criteria weights sum to exactly 100.
     */
    public function validateWeightSum(Competition $competition): bool
    {
        $sum = $competition->judgingCriteria()->where('is_active', true)->sum('weight');

        return abs((float) $sum - 100.0) < 0.01;
    }

    /**
     * Create a new criterion for a competition.
     */
    public function createCriterion(Competition $competition, array $data, ?\App\Models\User $admin = null): JudgingCriteria
    {
        $this->guardJudgingNotStarted($competition);

        $maxOrder = $competition->judgingCriteria()->max('sort_order') ?? 0;

        $criterion = $competition->judgingCriteria()->create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'weight' => $data['weight'],
            'max_score' => $data['max_score'] ?? 100,
            'sort_order' => $data['sort_order'] ?? ($maxOrder + 1),
            'is_active' => $data['is_active'] ?? true,
        ]);

        $this->auditService->log($admin, 'criterion_created', 'JudgingCriteria', $criterion->id, [
            'competition_id' => $competition->id,
            'name' => $criterion->name,
            'weight' => $criterion->weight,
        ]);

        return $criterion;
    }

    /**
     * Update an existing criterion.
     */
    public function updateCriterion(JudgingCriteria $criterion, array $data, ?\App\Models\User $admin = null): JudgingCriteria
    {
        $this->guardJudgingNotStarted($criterion->competition);

        $criterion->update(array_filter([
            'name' => $data['name'] ?? null,
            'description' => array_key_exists('description', $data) ? $data['description'] : null,
            'weight' => $data['weight'] ?? null,
            'max_score' => $data['max_score'] ?? null,
            'sort_order' => $data['sort_order'] ?? null,
            'is_active' => array_key_exists('is_active', $data) ? $data['is_active'] : null,
        ], fn ($v) => $v !== null));

        $this->auditService->log($admin, 'criterion_updated', 'JudgingCriteria', $criterion->id, [
            'changes' => $data,
        ]);

        return $criterion->fresh();
    }

    /**
     * Delete a criterion.
     */
    public function deleteCriterion(JudgingCriteria $criterion, ?\App\Models\User $admin = null): void
    {
        $this->guardJudgingNotStarted($criterion->competition);

        $this->auditService->log($admin, 'criterion_deleted', 'JudgingCriteria', $criterion->id, [
            'name' => $criterion->name,
            'competition_id' => $criterion->competition_id,
        ]);

        $criterion->delete();
    }

    /**
     * Guard: prevent criteria changes if judging has started.
     */
    protected function guardJudgingNotStarted(Competition $competition): void
    {
        if ($this->hasJudgingStarted($competition)) {
            throw ValidationException::withMessages([
                'criteria' => ['Kriteria penilaian tidak dapat diubah setelah penjurian dimulai.'],
            ]);
        }
    }
}
