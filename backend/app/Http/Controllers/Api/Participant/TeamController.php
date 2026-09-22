<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Participant\CreateTeamRequest;
use App\Http\Requests\Participant\JoinTeamRequest;
use App\Http\Requests\Participant\TransferLeadershipRequest;
use App\Http\Resources\TeamMemberResource;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Models\User;
use App\Services\TeamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TeamController extends ApiController
{
    public function __construct(
        protected TeamService $teamService
    ) {}

    /**
     * List all teams the authenticated user belongs to.
     */
    public function index(Request $request): JsonResponse
    {
        $teams = $this->teamService->getUserTeams($request->user());

        return $this->successResponse(
            TeamResource::collection($teams),
            'Teams retrieved successfully'
        );
    }

    /**
     * Create a new team.
     */
    public function store(CreateTeamRequest $request): JsonResponse
    {
        $team = $this->teamService->createTeam($request->user(), $request->validated());

        return $this->successResponse(
            new TeamResource($team),
            'Team created successfully',
            201
        );
    }

    /**
     * Get single team detail.
     */
    public function show(Request $request, Team $team): JsonResponse
    {
        $user = $request->user();
        $isMember = $team->members()->where('user_id', $user->id)->exists();

        if (! $user->isAdmin() && ! $isMember) {
            throw ValidationException::withMessages([
                'team' => ['Anda tidak memiliki akses ke data tim ini.'],
            ]);
        }

        $team->load(['competition', 'leader', 'members.user', 'registration']);

        return $this->successResponse(
            new TeamResource($team),
            'Team retrieved successfully'
        );
    }

    /**
     * Join an existing team using invite code.
     */
    public function join(JoinTeamRequest $request): JsonResponse
    {
        $member = $this->teamService->joinTeam($request->user(), (string) $request->input('code'));

        return $this->successResponse(
            new TeamMemberResource($member),
            'Berhasil bergabung dengan tim',
            201
        );
    }

    /**
     * Leave a team.
     */
    public function leave(Request $request, Team $team): JsonResponse
    {
        $this->teamService->leaveTeam($request->user(), $team);

        return $this->successResponse(
            null,
            'Berhasil keluar dari tim'
        );
    }

    /**
     * Remove member from team.
     */
    public function removeMember(Request $request, Team $team, User $user): JsonResponse
    {
        $this->teamService->removeMember($request->user(), $team, $user);

        return $this->successResponse(
            null,
            'Anggota tim berhasil dikeluarkan'
        );
    }

    /**
     * Transfer team leadership.
     */
    public function transferLeadership(TransferLeadershipRequest $request, Team $team): JsonResponse
    {
        /** @var User $newLeader */
        $newLeader = User::findOrFail($request->input('user_id'));

        $updatedTeam = $this->teamService->transferLeadership($request->user(), $team, $newLeader);

        return $this->successResponse(
            new TeamResource($updatedTeam),
            'Kepemimpinan tim berhasil dialihkan'
        );
    }

    /**
     * Dissolve/delete team.
     */
    public function destroy(Request $request, Team $team): JsonResponse
    {
        $this->teamService->dissolveTeam($request->user(), $team);

        return $this->successResponse(
            null,
            'Tim berhasil dibubarkan'
        );
    }
}
