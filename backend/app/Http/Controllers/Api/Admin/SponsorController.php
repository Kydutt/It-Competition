<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\SponsorResource;
use App\Models\Sponsor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SponsorController extends ApiController
{
    public function index(): JsonResponse
    {
        $sponsors = Sponsor::orderBy('order')->get();

        return $this->successResponse(
            SponsorResource::collection($sponsors),
            'Sponsors retrieved successfully'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'logo_url' => ['nullable', 'string'],
            'tier' => ['nullable', 'string', 'max:50'],
            'website_url' => ['nullable', 'url'],
            'order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $sponsor = Sponsor::create($validated);

        return $this->successResponse(
            new SponsorResource($sponsor),
            'Sponsor created successfully',
            201
        );
    }

    public function destroy(Sponsor $sponsor): JsonResponse
    {
        $sponsor->delete();

        return $this->successResponse(null, 'Sponsor deleted successfully');
    }
}
