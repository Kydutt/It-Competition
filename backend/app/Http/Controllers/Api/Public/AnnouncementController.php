<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;

class AnnouncementController extends ApiController
{
    public function index(): JsonResponse
    {
        $announcements = Announcement::where('is_published', true)
            ->with('competition')
            ->latest('published_at')
            ->get();

        return $this->successResponse(
            AnnouncementResource::collection($announcements),
            'Announcements retrieved successfully'
        );
    }

    public function show(string $slug): JsonResponse
    {
        $announcement = Announcement::where('slug', $slug)
            ->where('is_published', true)
            ->with('competition')
            ->firstOrFail();

        return $this->successResponse(
            new AnnouncementResource($announcement),
            'Announcement detail retrieved successfully'
        );
    }
}
