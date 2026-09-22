<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\SponsorResource;
use App\Models\Sponsor;
use Illuminate\Http\JsonResponse;

class SponsorController extends ApiController
{
    public function index(): JsonResponse
    {
        $sponsors = Sponsor::where('is_active', true)
            ->orderBy('order')
            ->get();

        return $this->successResponse(
            SponsorResource::collection($sponsors),
            'Sponsors retrieved successfully'
        );
    }
}
