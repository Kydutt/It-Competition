<?php

namespace App\Http\Controllers\Api\Public;

use App\Enums\CompetitionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\CompetitionCategoryResource;
use App\Models\CompetitionCategory;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = CompetitionCategory::query()
            ->withCount(['competitions' => function ($query) {
                $query->where('status', '!=', CompetitionStatus::DRAFT);
            }])
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar kategori kompetisi berhasil diambil.',
            'data' => CompetitionCategoryResource::collection($categories),
        ]);
    }
}
