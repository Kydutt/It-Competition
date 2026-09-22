<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends ApiController
{
    public function show(Request $request): JsonResponse
    {
        return $this->successResponse(
            new UserResource($request->user()),
            'Profile retrieved successfully'
        );
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'institution' => ['nullable', 'string', 'max:255'],
            'avatar_url' => ['nullable', 'string'],
        ]);

        $user->update($validated);

        return $this->successResponse(
            new UserResource($user),
            'Profile updated successfully'
        );
    }
}
