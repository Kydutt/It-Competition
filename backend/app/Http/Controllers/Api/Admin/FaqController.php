<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateFaqRequest;
use App\Http\Requests\Admin\UpdateFaqRequest;
use App\Models\Faq;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Faq::query();

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->has('is_published')) {
            $query->where('is_published', $request->boolean('is_published'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                    ->orWhere('answer', 'like', "%{$search}%");
            });
        }

        $faqs = $query->orderBy('sort_order')->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => $faqs,
        ]);
    }

    public function store(CreateFaqRequest $request): JsonResponse
    {
        $data = $request->validated();
        if (! isset($data['sort_order'])) {
            $data['sort_order'] = (Faq::max('sort_order') ?? 0) + 1;
        }

        $faq = Faq::create($data);

        ActivityLogService::log(
            action: 'faq.create',
            entityType: 'Faq',
            entityId: $faq->id,
            oldValues: null,
            newValues: $faq->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'FAQ berhasil dibuat.',
            'data' => $faq,
        ], 201);
    }

    public function show(Faq $faq): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $faq,
        ]);
    }

    public function update(UpdateFaqRequest $request, Faq $faq): JsonResponse
    {
        $data = $request->validated();
        $oldValues = $faq->toArray();
        $faq->update($data);

        ActivityLogService::log(
            action: 'faq.update',
            entityType: 'Faq',
            entityId: $faq->id,
            oldValues: $oldValues,
            newValues: $faq->fresh()->toArray(),
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'FAQ berhasil diperbarui.',
            'data' => $faq->fresh(),
        ]);
    }

    public function destroy(Request $request, Faq $faq): JsonResponse
    {
        $oldValues = $faq->toArray();
        $faqId = $faq->id;
        $faq->delete();

        ActivityLogService::log(
            action: 'faq.delete',
            entityType: 'Faq',
            entityId: $faqId,
            oldValues: $oldValues,
            newValues: null,
            actor: $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'FAQ berhasil dihapus.',
        ]);
    }
}
