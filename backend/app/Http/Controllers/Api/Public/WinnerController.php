<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\WinnerResource;
use App\Models\Winner;
use Illuminate\Http\JsonResponse;

class WinnerController extends ApiController
{
    public function index(): JsonResponse
    {
        $winners = Winner::with(['competition', 'team'])
            ->orderBy('competition_id')
            ->orderBy('rank')
            ->get();

        return $this->successResponse(
            WinnerResource::collection($winners),
            'Winners retrieved successfully'
        );
    }
}
