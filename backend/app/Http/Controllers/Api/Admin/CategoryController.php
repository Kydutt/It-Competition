<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\CompetitionCategory;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = CompetitionCategory::withCount([
            'competitions',
            'competitions as all_competitions_count' => function ($query) {
                $query->withTrashed();
            },
        ])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function store(CreateCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
            $originalSlug = $data['slug'];
            $count = 1;
            while (CompetitionCategory::where('slug', $data['slug'])->exists()) {
                $data['slug'] = "{$originalSlug}-{$count}";
                $count++;
            }
        }

        $category = CompetitionCategory::create($data);

        ActivityLogService::log(
            action: 'category.create',
            entityType: 'CompetitionCategory',
            entityId: $category->id,
            oldValues: null,
            newValues: $category->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Kategori kompetisi berhasil dibuat.',
            'data' => $category,
        ], 201);
    }

    public function show(CompetitionCategory $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $category->load('competitions'),
        ]);
    }

    public function update(UpdateCategoryRequest $request, CompetitionCategory $category): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
            $originalSlug = $data['slug'];
            $count = 1;
            while (CompetitionCategory::where('slug', $data['slug'])->where('id', '!=', $category->id)->exists()) {
                $data['slug'] = "{$originalSlug}-{$count}";
                $count++;
            }
        }

        $oldValues = $category->toArray();
        $category->update($data);

        ActivityLogService::log(
            action: 'category.update',
            entityType: 'CompetitionCategory',
            entityId: $category->id,
            oldValues: $oldValues,
            newValues: $category->fresh()->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Kategori kompetisi berhasil diperbarui.',
            'data' => $category->fresh(),
        ]);
    }

    public function destroy(Request $request, CompetitionCategory $category): JsonResponse
    {
        $competitionsQuery = $category->competitions()->withTrashed();
        if ($competitionsQuery->exists()) {
            $competitions = $competitionsQuery->pluck('name')->all();
            $competitionsCount = count($competitions);
            $displayNames = implode(', ', array_slice($competitions, 0, 3));
            if ($competitionsCount > 3) {
                $displayNames .= ', dan ' . ($competitionsCount - 3) . ' lainnya';
            }

            return response()->json([
                'success' => false,
                'message' => "Kategori tidak dapat dihapus karena masih digunakan oleh {$competitionsCount} kompetisi ({$displayNames}). Hapus atau pindahkan relasi kompetisi terlebih dahulu.",
                'data' => [
                    'competitions' => $competitions,
                    'competitions_count' => $competitionsCount,
                ],
            ], 409);
        }

        try {
            DB::transaction(function () use ($category, $request) {
                $oldValues = $category->toArray();
                $categoryId = $category->id;
                $category->delete();

                ActivityLogService::log(
                    action: 'category.delete',
                    entityType: 'CompetitionCategory',
                    entityId: $categoryId,
                    oldValues: $oldValues,
                    newValues: null,
                    actor: $request->user()
                );
            });

            return response()->json([
                'success' => true,
                'message' => 'Kategori kompetisi berhasil dihapus.',
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000' || (isset($e->errorInfo[1]) && in_array($e->errorInfo[1], [1451, 1217]))) {
                Log::warning("Foreign key constraint violation when deleting category [{$category->id}]: " . $e->getMessage());

                return response()->json([
                    'success' => false,
                    'message' => 'Kategori tidak dapat dihapus karena masih digunakan oleh kompetisi atau data terkait lainnya. Hapus atau pindahkan relasi terkait terlebih dahulu.',
                    'data' => [
                        'error_code' => 'FOREIGN_KEY_VIOLATION',
                    ],
                ], 409);
            }

            Log::error("Database error while deleting category [{$category->id}]: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan basis data saat menghapus kategori kompetisi.',
            ], 500);
        } catch (\Throwable $e) {
            Log::error("Failed to delete category [{$category->id}]: " . $e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat menghapus kategori kompetisi.',
            ], 500);
        }
    }
}
