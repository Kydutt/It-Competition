<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\CriterionResource;
use App\Models\Competition;
use App\Models\JudgingCriteria;
use App\Services\CriteriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CriteriaController extends ApiController
{
    public function __construct(
        protected CriteriaService $criteriaService
    ) {}

    /**
     * List criteria for a competition.
     */
    public function index(Competition $competition): JsonResponse
    {
        $criteria = $this->criteriaService->getForCompetition($competition);
        $weightSum = $competition->judgingCriteria()->where('is_active', true)->sum('weight');

        return $this->successResponse([
            'criteria' => CriterionResource::collection($criteria),
            'weight_sum' => round((float) $weightSum, 2),
            'is_valid' => abs((float) $weightSum - 100.0) < 0.01,
            'judging_started' => $this->criteriaService->hasJudgingStarted($competition),
        ], 'Criteria retrieved successfully');
    }

    /**
     * Create a new criterion.
     */
    public function store(Request $request, Competition $competition): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'weight' => 'required|numeric|min:0.01|max:100',
            'max_score' => 'sometimes|integer|min:1|max:1000',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $criterion = $this->criteriaService->createCriterion($competition, $validated, $request->user());

        return $this->successResponse(
            new CriterionResource($criterion),
            'Kriteria penilaian berhasil ditambahkan',
            201
        );
    }

    /**
     * Update a criterion.
     */
    public function update(Request $request, JudgingCriteria $criterion): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'weight' => 'sometimes|numeric|min:0.01|max:100',
            'max_score' => 'sometimes|integer|min:1|max:1000',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $criterion = $this->criteriaService->updateCriterion($criterion, $validated, $request->user());

        return $this->successResponse(
            new CriterionResource($criterion),
            'Kriteria penilaian berhasil diperbarui'
        );
    }

    /**
     * Delete a criterion.
     */
    public function destroy(Request $request, JudgingCriteria $criterion): JsonResponse
    {
        $this->criteriaService->deleteCriterion($criterion, $request->user());

        return $this->successResponse(null, 'Kriteria penilaian berhasil dihapus');
    }
}
