<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\SubmissionResource;
use App\Models\Submission;
use App\Services\SubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubmissionController extends ApiController
{
    public function __construct(
        protected SubmissionService $submissionService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $competitionId = $request->query('competition_id') ? (int) $request->query('competition_id') : null;
        $submissions = $this->submissionService->getSubmissionsPaginated($competitionId, (int) $request->query('per_page', 15));

        return $this->successResponse(
            SubmissionResource::collection($submissions)->response()->getData(true),
            'Submissions retrieved successfully'
        );
    }

    public function show(Submission $submission): JsonResponse
    {
        return $this->successResponse(
            new SubmissionResource($submission->load(['competition', 'team.leader', 'scores.judge', 'scores.judgingCriteria'])),
            'Submission details retrieved successfully'
        );
    }
}
