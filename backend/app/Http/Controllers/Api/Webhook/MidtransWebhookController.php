<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Webhook;

use App\Http\Controllers\Controller;
use App\Http\Requests\Webhook\MidtransWebhookRequest;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;

class MidtransWebhookController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Handle incoming Midtrans HTTP notification webhook (stateless, signature-verified).
     */
    public function handle(MidtransWebhookRequest $request): JsonResponse
    {
        $result = $this->paymentService->handleWebhook($request->validated());

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'order_id' => $result['payment']->order_id,
                'status' => $result['payment']->status->value,
            ],
        ]);
    }
}
