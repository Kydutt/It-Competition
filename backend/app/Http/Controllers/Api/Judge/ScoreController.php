<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Judge;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Judge\ScoreSubmissionRequest;
use App\Services\JudgingService;
use Illuminate\Http\JsonResponse;

class ScoreController extends ApiController
{
    public function __construct(
        protected JudgingService $judgingService
    ) {}

    public function store(ScoreSubmissionRequest $request): JsonResponse
    {
        $scores = $this->judgingService->scoreSubmission($request->user(), $request->validated());

        return $this->successResponse($scores, 'Scores recorded successfully');
    }
}
