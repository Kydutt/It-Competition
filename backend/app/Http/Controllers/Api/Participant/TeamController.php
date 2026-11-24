<?php

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Participant\AddTeamMemberRequest;
use App\Http\Requests\Participant\CreateTeamRequest;
use App\Http\Requests\Participant\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Models\User;
use App\Services\TeamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TeamController extends Controller
{
    public function __construct(
        protected TeamService $teamService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $teams = Team::query()
            ->where(function ($q) use ($user) {
                $q->where('leader_id', $user->id)
                  ->orWhereHas('members', fn ($mq) => $mq->where('users.id', $user->id));
            })
            ->with(['leader.profile', 'members.profile'])
            ->withCount('members')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar tim berhasil diambil.',
            'data' => TeamResource::collection($teams),
        ]);
    }

    public function store(CreateTeamRequest $request): JsonResponse
    {
        $user = $request->user();
        $team = $this->teamService->createTeam($user, $request->validated('name'));

        return response()->json([
            'success' => true,
            'message' => 'Tim baru berhasil dibuat.',
            'data' => new TeamResource($team->load(['leader.profile', 'members.profile'])),
        ], 201);
    }

    public function show(Request $request, Team $team): JsonResponse
    {
        Gate::authorize('view', $team);

        $team->load(['leader.profile', 'members.profile', 'registrations.competition']);

        return response()->json([
            'success' => true,
            'message' => 'Detail tim berhasil diambil.',
            'data' => new TeamResource($team),
        ]);
    }

    public function update(UpdateTeamRequest $request, Team $team): JsonResponse
    {
        Gate::authorize('update', $team);

        $team->update([
            'name' => $request->validated('name'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Nama tim berhasil diperbarui.',
            'data' => new TeamResource($team->fresh(['leader.profile', 'members.profile'])),
        ]);
    }

    public function addMember(AddTeamMemberRequest $request, Team $team): JsonResponse
    {
        Gate::authorize('addMember', $team);

        $this->teamService->addMemberByEmail($team, $request->validated('email'));

        return response()->json([
            'success' => true,
            'message' => 'Anggota tim berhasil ditambahkan.',
            'data' => new TeamResource($team->fresh(['leader.profile', 'members.profile'])),
        ]);
    }

    public function removeMember(Request $request, Team $team, User $member): JsonResponse
    {
        Gate::authorize('removeMember', [$team, $member]);

        $this->teamService->removeMember($team, $member);

        return response()->json([
            'success' => true,
            'message' => 'Anggota berhasil dikeluarkan dari tim.',
            'data' => new TeamResource($team->fresh(['leader.profile', 'members.profile'])),
        ]);
    }
}
