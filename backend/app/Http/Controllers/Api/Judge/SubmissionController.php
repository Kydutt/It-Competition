<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Judge;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\SubmissionResource;
use App\Models\Submission;
use App\Services\JudgingService;
use App\Services\SubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubmissionController extends ApiController
{
    public function __construct(
        protected SubmissionService $submissionService,
        protected JudgingService $judgingService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $competitionId = $request->query('competition_id') ? (int) $request->query('competition_id') : null;
        $submissions = $this->submissionService->getSubmissionsPaginated($competitionId, (int) $request->query('per_page', 15));

        return $this->successResponse(
            SubmissionResource::collection($submissions)->response()->getData(true),
            'Submissions retrieved for judging'
        );
    }

    public function show(Submission $submission, Request $request): JsonResponse
    {
        $evaluation = $this->judgingService->getSubmissionEvaluation($submission, $request->user());

        return $this->successResponse([
            'submission' => new SubmissionResource($evaluation['submission']),
            'criteria' => $evaluation['criteria'],
            'my_scores' => $evaluation['existing_scores'],
        ], 'Submission evaluation details retrieved');
    }
}
