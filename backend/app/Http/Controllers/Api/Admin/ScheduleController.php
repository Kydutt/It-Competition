<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateScheduleRequest;
use App\Http\Requests\Admin\UpdateScheduleRequest;
use App\Models\Schedule;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Schedule::with('event:id,name');

        if ($request->filled('event_id')) {
            $query->where('event_id', $request->input('event_id'));
        }

        $schedules = $query->orderBy('start_at')->get();

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    public function store(CreateScheduleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $schedule = Schedule::create($data);

        ActivityLogService::log(
            action: 'schedule.create',
            entityType: 'Schedule',
            entityId: $schedule->id,
            oldValues: null,
            newValues: $schedule->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil ditambahkan.',
            'data' => $schedule->load('event'),
        ], 201);
    }

    public function show(Schedule $schedule): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $schedule->load('event'),
        ]);
    }

    public function update(UpdateScheduleRequest $request, Schedule $schedule): JsonResponse
    {
        $data = $request->validated();
        $oldValues = $schedule->toArray();
        $schedule->update($data);

        ActivityLogService::log(
            action: 'schedule.update',
            entityType: 'Schedule',
            entityId: $schedule->id,
            oldValues: $oldValues,
            newValues: $schedule->fresh()->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil diperbarui.',
            'data' => $schedule->fresh()->load('event'),
        ]);
    }

    public function destroy(Request $request, Schedule $schedule): JsonResponse
    {
        $oldValues = $schedule->toArray();
        $scheduleId = $schedule->id;
        $schedule->delete();

        ActivityLogService::log(
            action: 'schedule.delete',
            entityType: 'Schedule',
            entityId: $scheduleId,
            oldValues: $oldValues,
            newValues: null,
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Jadwal berhasil dihapus.',
        ]);
    }
}
