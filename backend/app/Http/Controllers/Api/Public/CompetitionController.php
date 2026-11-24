<?php

namespace App\Http\Controllers\Api\Public;

use App\Enums\CompetitionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CompetitionResource;
use App\Models\Competition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompetitionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Competition::query()
            ->where('status', '!=', CompetitionStatus::DRAFT)
            ->with(['category', 'event']);

        // Search by name or description
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        // Filter by category slug or id
        if ($category = $request->query('category')) {
            $query->whereHas('category', function ($q) use ($category) {
                $q->where('slug', $category)->orWhere('id', $category);
            });
        }

        // Filter by event slug or id
        if ($event = $request->query('event')) {
            $query->whereHas('event', function ($q) use ($event) {
                $q->where('slug', $event)->orWhere('id', $event);
            });
        }

        // Filter by status (e.g. registration_open)
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Filter by registration_type (individual vs team)
        if ($type = $request->query('type')) {
            $query->where('registration_type', $type);
        }

        $perPage = min((int) $request->query('per_page', 9), 50);
        $competitions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Daftar kompetisi berhasil diambil.',
            'data' => CompetitionResource::collection($competitions),
            'meta' => [
                'current_page' => $competitions->currentPage(),
                'last_page' => $competitions->lastPage(),
                'per_page' => $competitions->perPage(),
                'total' => $competitions->total(),
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $competition = Competition::query()
            ->where('slug', $slug)
            ->where('status', '!=', CompetitionStatus::DRAFT)
            ->with(['category', 'event.schedules'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'message' => 'Detail kompetisi berhasil diambil.',
            'data' => new CompetitionResource($competition),
        ]);
    }
}
