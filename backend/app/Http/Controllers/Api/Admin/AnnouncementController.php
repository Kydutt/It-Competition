<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateAnnouncementRequest;
use App\Http\Requests\Admin\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::with(['event:id,name', 'competition:id,name']);

        if ($request->filled('audience')) {
            $query->where('audience', $request->input('audience'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('title', 'like', "%{$search}%");
        }

        $announcements = $query->latest('id')->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }

    public function store(CreateAnnouncementRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
            $originalSlug = $data['slug'];
            $count = 1;
            while (Announcement::where('slug', $data['slug'])->exists()) {
                $data['slug'] = "{$originalSlug}-{$count}";
                $count++;
            }
        }

        if (empty($data['published_at']) && ($data['status'] ?? null) === 'published') {
            $data['published_at'] = now();
        }

        $announcement = Announcement::create($data);

        ActivityLogService::log(
            action: 'announcement.create',
            entityType: 'Announcement',
            entityId: $announcement->id,
            oldValues: null,
            newValues: $announcement->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dibuat.',
            'data' => $announcement->load(['event', 'competition']),
        ], 201);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $announcement->load(['event', 'competition']),
        ]);
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['title']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
            $originalSlug = $data['slug'];
            $count = 1;
            while (Announcement::where('slug', $data['slug'])->where('id', '!=', $announcement->id)->exists()) {
                $data['slug'] = "{$originalSlug}-{$count}";
                $count++;
            }
        }

        $oldValues = $announcement->toArray();
        $announcement->update($data);

        ActivityLogService::log(
            action: 'announcement.update',
            entityType: 'Announcement',
            entityId: $announcement->id,
            oldValues: $oldValues,
            newValues: $announcement->fresh()->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil diperbarui.',
            'data' => $announcement->fresh()->load(['event', 'competition']),
        ]);
    }

    public function destroy(Request $request, Announcement $announcement): JsonResponse
    {
        $oldValues = $announcement->toArray();
        $announcementId = $announcement->id;
        $announcement->delete();

        ActivityLogService::log(
            action: 'announcement.delete',
            entityType: 'Announcement',
            entityId: $announcementId,
            oldValues: $oldValues,
            newValues: null,
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengumuman berhasil dihapus.',
        ]);
    }
}
