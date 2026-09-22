<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Admin\ChangeCompetitionStatusRequest;
use App\Http\Requests\Admin\StoreCompetitionRequest;
use App\Http\Requests\Admin\UpdateCompetitionRequest;
use App\Http\Resources\CompetitionResource;
use App\Models\Competition;
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
        $perPage = (int) $request->query('per_page', 15);
        $competitions = $this->competitionService->getAdminPaginated($request->all(), $perPage);

        return $this->successResponse(
            CompetitionResource::collection($competitions)->response()->getData(true),
            'Competitions retrieved successfully'
        );
    }

    public function store(StoreCompetitionRequest $request): JsonResponse
    {
        $competition = $this->competitionService->create($request->validated());

        return $this->successResponse(
            new CompetitionResource($competition),
            'Competition created successfully',
            201
        );
    }

    public function show(Competition $competition): JsonResponse
    {
        $competition->load(['judgingCriteria', 'announcements']);

        return $this->successResponse(
            new CompetitionResource($competition),
            'Competition retrieved successfully'
        );
    }

    public function update(UpdateCompetitionRequest $request, Competition $competition): JsonResponse
    {
        $updated = $this->competitionService->update($competition, $request->validated());

        return $this->successResponse(
            new CompetitionResource($updated),
            'Competition updated successfully'
        );
    }

    public function destroy(Competition $competition): JsonResponse
    {
        $this->competitionService->delete($competition);

        return $this->successResponse(null, 'Competition deleted successfully');
    }

    public function publish(Competition $competition): JsonResponse
    {
        $published = $this->competitionService->publish($competition);

        return $this->successResponse(
            new CompetitionResource($published),
            'Competition published successfully'
        );
    }

    public function unpublish(Competition $competition): JsonResponse
    {
        $unpublished = $this->competitionService->unpublish($competition);

        return $this->successResponse(
            new CompetitionResource($unpublished),
            'Competition unpublished successfully'
        );
    }

    public function changeStatus(ChangeCompetitionStatusRequest $request, Competition $competition): JsonResponse
    {
        $updated = $this->competitionService->changeStatus($competition, $request->validated('status'));

        return $this->successResponse(
            new CompetitionResource($updated),
            'Competition status updated successfully'
        );
    }
}
