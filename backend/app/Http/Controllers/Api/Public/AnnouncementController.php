<?php

namespace App\Http\Controllers\Api\Public;

use App\Enums\AnnouncementAudience;
use App\Enums\AnnouncementStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 9), 50);

        $announcements = Announcement::query()
            ->where('status', AnnouncementStatus::PUBLISHED)
            ->where('audience', AnnouncementAudience::PUBLIC)
            ->with(['event', 'competition'])
            ->orderBy('published_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengumuman publik berhasil diambil.',
            'data' => AnnouncementResource::collection($announcements),
            'meta' => [
                'current_page' => $announcements->currentPage(),
                'last_page' => $announcements->lastPage(),
                'per_page' => $announcements->perPage(),
                'total' => $announcements->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $announcement = Announcement::query()
            ->where('slug', $slug)
            ->where('status', AnnouncementStatus::PUBLISHED)
            ->where('audience', AnnouncementAudience::PUBLIC)
            ->with(['event', 'competition'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'message' => 'Detail pengumuman berhasil diambil.',
            'data' => new AnnouncementResource($announcement),
        ]);
    }
}
