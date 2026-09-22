<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Judge;

use App\Http\Controllers\Api\ApiController;
use App\Models\Score;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    public function __invoke(Request $request): JsonResponse
    {
        $judge = $request->user();

        $stats = [
            'total_submissions' => Submission::count(),
            'scored_by_me' => Score::where('judge_id', $judge->id)->distinct('submission_id')->count('submission_id'),
        ];

        return $this->successResponse($stats, 'Judge dashboard statistics retrieved');
    }
}
