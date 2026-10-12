<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\JudgeResource;
use App\Models\Judge;
use App\Services\JudgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JudgeController extends ApiController
{
    public function __construct(
        protected JudgeService $judgeService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'is_active']);
        $perPage = (int) $request->query('per_page', 15);
        $judges = $this->judgeService->getPaginated($filters, $perPage);

        return $this->successResponse(
            JudgeResource::collection($judges)->response()->getData(true),
            'Judges retrieved successfully'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'sometimes|string|min:8',
            'phone' => 'nullable|string|max:20',
            'institution' => 'nullable|string|max:255',
            'judge_code' => 'sometimes|string|max:20|unique:judges,judge_code',
            'bio' => 'nullable|string|max:2000',
            'is_active' => 'sometimes|boolean',
        ]);

        $judge = $this->judgeService->createJudge($validated, $request->user());

        return $this->successResponse(
            new JudgeResource($judge),
            'Juri berhasil ditambahkan',
            201
        );
    }

    public function show(Judge $judge): JsonResponse
    {
        $judge->load(['user', 'assignments.competition', 'assignments.session']);

        return $this->successResponse(
            new JudgeResource($judge),
            'Judge details retrieved'
        );
    }

    public function update(Request $request, Judge $judge): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'institution' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:2000',
            'is_active' => 'sometimes|boolean',
        ]);

        $judge = $this->judgeService->updateJudge($judge, $validated, $request->user());

        return $this->successResponse(
            new JudgeResource($judge),
            'Profil juri berhasil diperbarui'
        );
    }

    public function destroy(Request $request, Judge $judge): JsonResponse
    {
        $this->judgeService->deleteJudge($judge, $request->user());

        return $this->successResponse(null, 'Juri berhasil dinonaktifkan');
    }
}
