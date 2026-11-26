<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Participant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Participant\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Registration;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * List all payments visible to the authenticated participant (or team member).
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $payments = $this->paymentService->getParticipantPayments($request->user(), null, $perPage);

        return response()->json([
            'success' => true,
            'message' => 'Daftar transaksi pembayaran berhasil diambil.',
            'data' => PaymentResource::collection($payments),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    /**
     * List payments for a specific registration.
     */
    public function registrationIndex(Request $request, Registration $registration): JsonResponse
    {
        Gate::authorize('view', $registration);

        $perPage = (int) $request->query('per_page', 15);
        $payments = $this->paymentService->getParticipantPayments($request->user(), $registration->id, $perPage);

        return response()->json([
            'success' => true,
            'message' => 'Daftar transaksi pembayaran pendaftaran berhasil diambil.',
            'data' => PaymentResource::collection($payments),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    /**
     * Create a new Midtrans Snap payment or reuse an active pending transaction.
     */
    public function store(StorePaymentRequest $request, Registration $registration): JsonResponse
    {
        Gate::authorize('create', [Payment::class, $registration]);

        $result = $this->paymentService->createOrReuseSnapPayment($request->user(), $registration);

        return response()->json([
            'success' => true,
            'message' => $result['created']
                ? 'Transaksi pembayaran Snap berhasil dibuat.'
                : 'Menggunakan transaksi pembayaran yang masih aktif.',
            'data' => new PaymentResource($result['payment']),
        ], $result['created'] ? 201 : 200);
    }

    /**
     * View a specific payment detail.
     */
    public function show(Request $request, Payment $payment): JsonResponse
    {
        $payment->load(['registration.competition', 'registration.team.members', 'registration.team.leader', 'user']);
        Gate::authorize('view', $payment);

        return response()->json([
            'success' => true,
            'message' => 'Detail transaksi pembayaran berhasil diambil.',
            'data' => new PaymentResource($payment),
        ]);
    }

    /**
     * Reconcile a payment status directly with Midtrans Status API.
     */
    public function sync(Request $request, Payment $payment): JsonResponse
    {
        $payment->load(['registration.competition', 'registration.team.members', 'registration.team.leader', 'user']);
        Gate::authorize('sync', $payment);

        $synced = $this->paymentService->syncPaymentStatusFromMidtrans($payment, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Status pembayaran berhasil disinkronkan dengan Midtrans.',
            'data' => new PaymentResource($synced),
        ]);
    }
}
