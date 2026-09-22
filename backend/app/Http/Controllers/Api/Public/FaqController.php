<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\FaqResource;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;

class FaqController extends ApiController
{
    public function index(): JsonResponse
    {
        $faqs = Faq::where('is_published', true)
            ->orderBy('order')
            ->get();

        return $this->successResponse(
            FaqResource::collection($faqs),
            'FAQs retrieved successfully'
        );
    }
}
