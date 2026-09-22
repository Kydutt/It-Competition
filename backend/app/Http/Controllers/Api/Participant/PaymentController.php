<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Participant\StorePaymentRequest;
use App\Http\Requests\Participant\UploadPaymentProofRequest;
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
     * List all payments related to user.
     */
    public function index(Request $request): JsonResponse
    {
        $payments = $this->paymentService->getUserPayments($request->user());

        return $this->successResponse(
            PaymentResource::collection($payments),
            'Payments retrieved successfully'
        );
    }

    /**
     * Initiate payment for a paid competition registration.
     */
    public function store(StorePaymentRequest $request): JsonResponse
    {
        $payment = $this->paymentService->createPayment(
            $request->user(),
            (int) $request->input('registration_id'),
            (string) $request->input('payment_method', 'bank_transfer')
        );

        return $this->successResponse(
            new PaymentResource($payment),
            'Instruksi pembayaran berhasil dibuat',
            201
        );
    }

    /**
     * View payment details.
     */
    public function show(Request $request, Payment $payment): JsonResponse
    {
        $user = $request->user();
        $isOwner = $payment->user_id === $user->id || $payment->registration?->user_id === $user->id;
        $isTeamMember = $payment->registration?->team?->members()->where('user_id', $user->id)->exists() ?? false;

        if (! $user->isAdmin() && ! $isOwner && ! $isTeamMember) {
            abort(403, 'Anda tidak memiliki hak akses ke data pembayaran ini.');
        }

        $payment->load(['registration.competition', 'registration.team.leader', 'user', 'reviewer']);

        return $this->successResponse(
            new PaymentResource($payment),
            'Payment retrieved successfully'
        );
    }

    /**
     * Upload payment proof file.
     */
    public function uploadProof(UploadPaymentProofRequest $request, Payment $payment): JsonResponse
    {
        $updated = $this->paymentService->uploadProof(
            $request->user(),
            $payment,
            $request->file('proof')
        );

        return $this->successResponse(
            new PaymentResource($updated),
            'Bukti pembayaran berhasil diunggah. Silakan klik Submit untuk mengirim berkas verifikasi.'
        );
    }

    /**
     * Submit payment for admin verification.
     */
    public function submit(Request $request, Payment $payment): JsonResponse
    {
        $submitted = $this->paymentService->submitPayment($request->user(), $payment);

        return $this->successResponse(
            new PaymentResource($submitted),
            'Pembayaran berhasil diajukan untuk ditinjau oleh panitia'
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
