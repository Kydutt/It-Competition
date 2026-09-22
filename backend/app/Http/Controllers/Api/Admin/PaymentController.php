<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Admin\VerifyPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
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
        $payments = $this->paymentService->getAdminPaginated((int) $request->query('per_page', 15));

        return $this->successResponse(
            PaymentResource::collection($payments)->response()->getData(true),
            'Payments retrieved successfully'
        );
    }

    public function verify(VerifyPaymentRequest $request, Payment $payment): JsonResponse
    {
        $updated = $this->paymentService->verify(
            $payment,
            $request->enum('status', PaymentStatus::class),
            $request->input('notes'),
            $request->user()
        );

        return $this->successResponse(
            new PaymentResource($updated),
            'Payment verified successfully'
        );
    }
}
