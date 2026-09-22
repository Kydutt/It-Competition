<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\WinnerResource;
use App\Models\Winner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WinnerController extends ApiController
{
    public function index(): JsonResponse
    {
        $winners = Winner::with(['competition', 'team'])->orderBy('rank')->get();

        return $this->successResponse(
            WinnerResource::collection($winners),
            'Winners retrieved successfully'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'competition_id' => ['required', 'exists:competitions,id'],
            'team_id' => ['required', 'exists:teams,id'],
            'title' => ['required', 'string', 'max:255'],
            'rank' => ['required', 'integer', 'min:1'],
            'prize' => ['nullable', 'string', 'max:255'],
            'certificate_url' => ['nullable', 'string'],
        ]);

        $winner = Winner::create($validated);

        return $this->successResponse(
            new WinnerResource($winner->load(['competition', 'team'])),
            'Winner assigned successfully',
            201
        );
    }

    public function destroy(Winner $winner): JsonResponse
    {
        $winner->delete();

        return $this->successResponse(null, 'Winner deleted successfully');
    }
}
