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
        $query = User::where('role', UserRole::Participant);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('institution', 'like', "%{$search}%");
            });
        }

        $participants = $query->latest()
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
