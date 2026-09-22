<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParticipantController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $participants = User::where('role', UserRole::Participant)
            ->latest()
            ->paginate((int) $request->query('per_page', 15));

        return $this->successResponse(
            UserResource::collection($participants)->response()->getData(true),
            'Participants retrieved successfully'
        );
    }

    public function show(User $participant): JsonResponse
    {
        return $this->successResponse(
            new UserResource($participant->load(['registrations.competition', 'teams'])),
            'Participant details retrieved successfully'
        );
    }
}
