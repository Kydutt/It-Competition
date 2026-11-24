<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ScheduleResource;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Schedule::query()
            ->where('is_published', true)
            ->with('event');

        if ($eventId = $request->query('event_id')) {
            $query->where('event_id', $eventId);
        }

        $schedules = $query->orderBy('start_at', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal kegiatan berhasil diambil.',
            'data' => ScheduleResource::collection($schedules),
        ]);
    }
}
