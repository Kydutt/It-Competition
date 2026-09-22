<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AnnouncementController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $announcements = Announcement::with('competition')
            ->latest()
            ->paginate((int) $request->query('per_page', 15));

        return $this->successResponse(
            AnnouncementResource::collection($announcements)->response()->getData(true),
            'Announcements retrieved successfully'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'competition_id' => ['nullable', 'exists:competitions,id'],
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $validated['slug'] = Str::slug($validated['title']).'-'.Str::random(5);
        $validated['published_at'] = ($validated['is_published'] ?? true) ? now() : null;

        $announcement = Announcement::create($validated);

        return $this->successResponse(
            new AnnouncementResource($announcement),
            'Announcement created successfully',
            201
        );
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return $this->successResponse(null, 'Announcement deleted successfully');
    }
}
