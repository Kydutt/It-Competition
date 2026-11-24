<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateCompetitionRequest;
use App\Http\Requests\Admin\UpdateCompetitionRequest;
use App\Models\Competition;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CompetitionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Competition::with(['event:id,name', 'category:id,name'])
            ->withCount('registrations');

        if ($request->filled('event_id')) {
            $query->where('event_id', $request->input('event_id'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $competitions = $query->latest('id')->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $competitions,
        ]);
    }

    public function store(CreateCompetitionRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
            $originalSlug = $data['slug'];
            $count = 1;
            while (Competition::where('slug', $data['slug'])->exists()) {
                $data['slug'] = "{$originalSlug}-{$count}";
                $count++;
            }
        }

        $competition = Competition::create($data);

        ActivityLogService::log(
            action: 'competition.create',
            entityType: 'Competition',
            entityId: $competition->id,
            oldValues: null,
            newValues: $competition->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cabang kompetisi berhasil ditambahkan.',
            'data' => $competition->load(['event', 'category']),
        ], 201);
    }

    public function show(Competition $competition): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $competition->load(['event', 'category'])
                ->loadCount('registrations'),
        ]);
    }

    public function update(UpdateCompetitionRequest $request, Competition $competition): JsonResponse
    {
        $data = $request->validated();

        // Protect existing registrations from destructive format shifts
        if (isset($data['registration_type']) && $data['registration_type'] !== $competition->registration_type->value) {
            if ($competition->registrations()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format pendaftaran (individu/tim) tidak dapat diubah karena sudah memiliki pendaftaran terdaftar.',
                ], 422);
            }
        }

        if (isset($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
            $originalSlug = $data['slug'];
            $count = 1;
            while (Competition::where('slug', $data['slug'])->where('id', '!=', $competition->id)->exists()) {
                $data['slug'] = "{$originalSlug}-{$count}";
                $count++;
            }
        }

        $oldValues = $competition->toArray();
        $competition->update($data);

        ActivityLogService::log(
            action: 'competition.update',
            entityType: 'Competition',
            entityId: $competition->id,
            oldValues: $oldValues,
            newValues: $competition->fresh()->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cabang kompetisi berhasil diperbarui.',
            'data' => $competition->fresh()->load(['event', 'category']),
        ]);
    }

    public function destroy(Request $request, Competition $competition): JsonResponse
    {
        if ($competition->registrations()->exists()) {
            $count = $competition->registrations()->count();
            return response()->json([
                'success' => false,
                'message' => "Cabang kompetisi tidak dapat dihapus karena sudah memiliki {$count} data pendaftaran peserta.",
            ], 409);
        }

        try {
            DB::transaction(function () use ($competition, $request) {
                $oldValues = $competition->toArray();
                $competitionId = $competition->id;
                $competition->delete();

                ActivityLogService::log(
                    action: 'competition.delete',
                    entityType: 'Competition',
                    entityId: $competitionId,
                    oldValues: $oldValues,
                    newValues: null,
                    actor: $request->user()
                );
            });

            return response()->json([
                'success' => true,
                'message' => 'Cabang kompetisi berhasil dihapus.',
            ]);
        } catch (\Throwable $e) {
            Log::error("Failed to delete competition [{$competition->id}]: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat menghapus cabang kompetisi.',
            ], 500);
        }
    }
}
