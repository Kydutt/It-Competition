<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Participant\CreateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Services\TeamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends ApiController
{
    public function __construct(
        protected TeamService $teamService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $teams = $this->teamService->getUserTeams($request->user());

        return $this->successResponse(
            TeamResource::collection($teams),
            'Teams retrieved successfully'
        );
    }

    public function store(CreateTeamRequest $request): JsonResponse
    {
        $team = $this->teamService->createTeam($request->user(), $request->validated());

        return $this->successResponse(
            new TeamResource($team),
            'Team created successfully',
            201
        );
    }
}
