<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\CompetitionResource;
use App\Services\CompetitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompetitionController extends ApiController
{
    public function __construct(
        protected CompetitionService $competitionService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 10);
        $competitions = $this->competitionService->getPublicCompetitions($request->all(), $perPage);

        return $this->successResponse(
            CompetitionResource::collection($competitions)->response()->getData(true),
            'Competitions retrieved successfully'
        );
    }

    public function show(string $slug): JsonResponse
    {
        $competition = $this->competitionService->getBySlug($slug);

        return $this->successResponse(
            new CompetitionResource($competition),
            'Competition detail retrieved successfully'
        );
    }
}
