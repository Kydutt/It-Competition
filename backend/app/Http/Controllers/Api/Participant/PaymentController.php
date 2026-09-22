<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Participant\PaymentProofRequest;
use App\Http\Resources\PaymentResource;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends ApiController
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $payments = $this->paymentService->getUserPayments($request->user());

        return $this->successResponse(
            PaymentResource::collection($payments),
            'Payments retrieved successfully'
        );
    }

    public function store(PaymentProofRequest $request): JsonResponse
    {
        $payment = $this->paymentService->submitProof($request->user(), $request->validated());

        return $this->successResponse(
            new PaymentResource($payment),
            'Payment proof submitted successfully'
        );
    }
}
