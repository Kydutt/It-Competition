<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\JudgeAssignmentResource;
use App\Models\JudgeAssignment;
use App\Services\JudgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JudgeAssignmentController extends ApiController
{
    public function __construct(
        protected JudgeService $judgeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['competition_id', 'judge_id', 'status']);
        $perPage = (int) $request->query('per_page', 15);
        $assignments = $this->judgeService->getAssignmentsPaginated($filters, $perPage);

        return $this->successResponse(
            JudgeAssignmentResource::collection($assignments)->response()->getData(true),
            'Assignments retrieved successfully'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'judge_id' => 'required|integer|exists:judges,id',
            'registration_id' => 'required|integer|exists:registrations,id',
        ]);

        $assignment = $this->judgeService->assignJudge($validated, $request->user());

        return $this->successResponse(
            new JudgeAssignmentResource($assignment),
            'Juri berhasil ditugaskan',
            201
        );
    }

    public function destroy(Request $request, JudgeAssignment $assignment): JsonResponse
    {
        $this->judgeService->removeAssignment($assignment, $request->user());

        return $this->successResponse(null, 'Penugasan juri berhasil dihapus');
    }

    public function markConflict(Request $request, JudgeAssignment $assignment): JsonResponse
    {
        $validated = $request->validate([
            'conflict_reason' => 'required|string|max:1000',
        ]);

        $assignment = $this->judgeService->markConflict($assignment, $validated['conflict_reason'], $request->user());

        return $this->successResponse(
            new JudgeAssignmentResource($assignment),
            'Konflik kepentingan berhasil dicatat'
        );
    }
}
