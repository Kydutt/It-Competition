<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\FaqResource;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Faq::query()->where('is_published', true);

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        $faqs = $query->orderBy('sort_order', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar FAQ berhasil diambil.',
            'data' => FaqResource::collection($faqs),
        ]);
    }
}
