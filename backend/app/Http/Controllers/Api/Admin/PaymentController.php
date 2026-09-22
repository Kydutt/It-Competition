<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Admin\RejectPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentController extends ApiController
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Paginated list of payments with search and filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['competition_id', 'status', 'date', 'search']);
        $perPage = (int) $request->query('per_page', 15);

        $payments = $this->paymentService->getAdminPaginated($filters, $perPage);

        return $this->successResponse(
            PaymentResource::collection($payments)->response()->getData(true),
            'Payments retrieved successfully'
        );
    }

    /**
     * View payment details.
     */
    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['registration.competition', 'registration.team.leader', 'user', 'reviewer']);

        return $this->successResponse(
            new PaymentResource($payment),
            'Payment details retrieved successfully'
        );
    }

    /**
     * Approve payment.
     */
    public function approve(Request $request, Payment $payment): JsonResponse
    {
        $approved = $this->paymentService->approvePayment($payment, $request->user());

        return $this->successResponse(
            new PaymentResource($approved),
            'Pembayaran pendaftaran berhasil disetujui'
        );
    }

    /**
     * Reject payment with reason.
     */
    public function reject(RejectPaymentRequest $request, Payment $payment): JsonResponse
    {
        $rejected = $this->paymentService->rejectPayment(
            $payment,
            $request->user(),
            (string) $request->input('reason')
        );

        return $this->successResponse(
            new PaymentResource($rejected),
            'Pembayaran pendaftaran telah ditolak'
        );
    }

    /**
     * Download or view payment proof.
     */
    public function downloadProof(Request $request, Payment $payment): StreamedResponse
    {
        return $this->paymentService->getPaymentProofFile($request->user(), $payment);
    }
}
