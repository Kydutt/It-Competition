<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateEventRequest;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Models\Event;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $events = Event::withCount('competitions')
            ->latest('id')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }

    public function store(CreateEventRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
            // Ensure unique slug
            $originalSlug = $data['slug'];
            $count = 1;
            while (Event::where('slug', $data['slug'])->exists()) {
                $data['slug'] = "{$originalSlug}-{$count}";
                $count++;
            }
        }

        $event = Event::create($data);

        ActivityLogService::log(
            action: 'event.create',
            entityType: 'Event',
            entityId: $event->id,
            oldValues: null,
            newValues: $event->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Event perhelatan berhasil dibuat.',
            'data' => $event,
        ], 201);
    }

    public function show(Event $event): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $event->load(['competitions.category', 'schedules']),
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
            $originalSlug = $data['slug'];
            $count = 1;
            while (Event::where('slug', $data['slug'])->where('id', '!=', $event->id)->exists()) {
                $data['slug'] = "{$originalSlug}-{$count}";
                $count++;
            }
        }

        $oldValues = $event->toArray();
        $event->update($data);

        ActivityLogService::log(
            action: 'event.update',
            entityType: 'Event',
            entityId: $event->id,
            oldValues: $oldValues,
            newValues: $event->fresh()->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Event perhelatan berhasil diperbarui.',
            'data' => $event->fresh(),
        ]);
    }

    public function destroy(Request $request, Event $event): JsonResponse
    {
        if ($event->competitions()->whereHas('registrations')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak dapat dihapus karena memiliki kompetisi dengan pendaftaran aktif.',
            ], 422);
        }

        $oldValues = $event->toArray();
        $eventId = $event->id;
        $event->delete();

        ActivityLogService::log(
            action: 'event.delete',
            entityType: 'Event',
            entityId: $eventId,
            oldValues: $oldValues,
            newValues: null,
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Event berhasil dihapus.',
        ]);
    }
}
