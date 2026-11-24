<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventSetting;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $eventId = $request->input('event_id') ?? Event::latest('id')->value('id');

        $query = EventSetting::query();
        if ($eventId) {
            $query->where('event_id', $eventId);
        }

        $settings = $query->pluck('setting_value', 'setting_key');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event_id' => ['nullable', 'exists:events,id'],
            'settings' => ['required', 'array'],
        ]);

        $eventId = $data['event_id'] ?? Event::latest('id')->value('id');

        if (!$eventId) {
            $event = Event::create([
                'name' => 'IT Fest ' . date('Y'),
                'slug' => 'it-fest-' . date('Y'),
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays(30)->toDateString(),
                'status' => \App\Enums\EventStatus::PUBLISHED,
            ]);
            $eventId = $event->id;
        }

        $oldValues = EventSetting::where('event_id', $eventId)->pluck('setting_value', 'setting_key')->toArray();

        foreach ($data['settings'] as $key => $val) {
            EventSetting::updateOrCreate(
                [
                    'event_id' => $eventId,
                    'setting_key' => $key,
                ],
                [
                    'setting_value' => is_array($val) ? json_encode($val) : (string) $val,
                ]
            );
        }

        ActivityLogService::log(
            action: 'settings.update',
            entityType: 'EventSetting',
            entityId: $eventId,
            oldValues: $oldValues,
            newValues: $data['settings'],
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan sistem berhasil diperbarui.',
            'data' => EventSetting::where('event_id', $eventId)->pluck('setting_value', 'setting_key'),
        ]);
    }
}
