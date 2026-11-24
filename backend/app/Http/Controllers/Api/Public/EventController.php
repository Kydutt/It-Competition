<?php

namespace App\Http\Controllers\Api\Public;

use App\Enums\EventStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\JsonResponse;

class EventController extends Controller
{
    public function index(): JsonResponse
    {
        $events = Event::query()
            ->where('status', EventStatus::PUBLISHED)
            ->withCount('competitions')
            ->orderBy('start_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar acara publik berhasil diambil.',
            'data' => EventResource::collection($events),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $event = Event::query()
            ->where('slug', $slug)
            ->where('status', EventStatus::PUBLISHED)
            ->with(['competitions.category'])
            ->withCount('competitions')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'message' => 'Detail acara berhasil diambil.',
            'data' => new EventResource($event),
        ]);
    }
}
