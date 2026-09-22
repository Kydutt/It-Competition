<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\FaqResource;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaqController extends ApiController
{
    public function index(): JsonResponse
    {
        $faqs = Faq::orderBy('order')->get();

        return $this->successResponse(
            FaqResource::collection($faqs),
            'FAQs retrieved successfully'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'competition_id' => ['nullable', 'exists:competitions,id'],
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:50'],
            'order' => ['nullable', 'integer'],
            'is_published' => ['nullable', 'boolean'],
        ]);

        $faq = Faq::create($validated);

        return $this->successResponse(
            new FaqResource($faq),
            'FAQ created successfully',
            201
        );
    }

    public function destroy(Faq $faq): JsonResponse
    {
        $faq->delete();

        return $this->successResponse(null, 'FAQ deleted successfully');
    }
}
