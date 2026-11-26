<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentConfigController extends Controller
{
    public function show(Request $request, PaymentService $paymentService): JsonResponse
    {
        $eventId = $request->filled('event_id') ? (int) $request->query('event_id') : null;

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi pembayaran publik berhasil diambil.',
            'data' => $paymentService->getPublicPaymentConfig($eventId),
        ]);
    }
}
