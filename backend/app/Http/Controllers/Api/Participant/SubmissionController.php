<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Participant\SubmitWorkRequest;
use App\Http\Resources\SubmissionResource;
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
        $submissions = $this->submissionService->getUserSubmissions($request->user());

        return $this->successResponse(
            SubmissionResource::collection($submissions),
            'Submissions retrieved successfully'
        );
    }

    public function store(SubmitWorkRequest $request): JsonResponse
    {
        $submission = $this->submissionService->submitWork($request->user(), $request->validated());

        return $this->successResponse(
            new SubmissionResource($submission),
            'Submission saved successfully',
            201
        );
    }
}
