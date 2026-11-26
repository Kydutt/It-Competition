<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\PaymentException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MidtransService
{
    public function isProduction(): bool
    {
        return (bool) config('midtrans.is_production', false);
    }

    public function getSnapBaseUrl(): string
    {
        return $this->isProduction()
            ? 'https://app.midtrans.com/snap/v1'
            : 'https://app.sandbox.midtrans.com/snap/v1';
    }

    public function getApiBaseUrl(): string
    {
        return $this->isProduction()
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';
    }

    public function getSnapScriptUrl(): string
    {
        return $this->isProduction()
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
    }

    /**
     * Public configuration safe to expose to the frontend SPA.
     *
     * @return array{client_key: string, snap_script_url: string, is_production: bool}
     */
    public function getPublicConfig(): array
    {
        return [
            'client_key' => trim((string) config('midtrans.client_key', '')),
            'snap_script_url' => $this->getSnapScriptUrl(),
            'is_production' => $this->isProduction(),
        ];
    }

    /**
     * Create a Snap transaction via Midtrans Snap API using Laravel HTTP Client.
     *
     * @param  array<string, mixed>  $payload
     * @return array{token: string, redirect_url: string}
     */
    public function createSnapTransaction(array $payload): array
    {
        $serverKey = $this->requireServerKey();
        $endpoint = $this->getSnapBaseUrl() . '/transactions';
        $orderId = (string) ($payload['transaction_details']['order_id'] ?? '');

        try {
            $response = Http::withBasicAuth($serverKey, '')
                ->acceptJson()
                ->asJson()
                ->timeout((int) config('midtrans.timeout_seconds', 15))
                ->post($endpoint, $payload);
        } catch (ConnectionException $e) {
            Log::error('Midtrans Snap connection error', [
                'order_id' => $orderId,
                'environment' => $this->isProduction() ? 'production' : 'sandbox',
                'error' => $e->getMessage(),
            ]);

            throw new PaymentException(
                'Tidak dapat terhubung ke layanan pembayaran Midtrans. Silakan coba beberapa saat lagi.',
                502,
                $e
            );
        }

        if (! $response->successful()) {
            $body = $response->json();
            $errorMessages = is_array($body) ? ($body['error_messages'] ?? null) : null;

            Log::error('Midtrans Snap API returned error response', [
                'order_id' => $orderId,
                'http_status' => $response->status(),
                'error_messages' => $errorMessages,
            ]);

            throw new PaymentException(
                'Gagal membuat transaksi pembayaran pada Midtrans. Silakan coba kembali.',
                502
            );
        }

        $data = $response->json();
        $token = is_array($data) ? trim((string) ($data['token'] ?? '')) : '';
        $redirectUrl = is_array($data) ? trim((string) ($data['redirect_url'] ?? '')) : '';

        if ($token === '') {
            Log::error('Midtrans Snap API response missing token', [
                'order_id' => $orderId,
            ]);

            throw new PaymentException(
                'Respons token pembayaran dari Midtrans tidak valid.',
                502
            );
        }

        return [
            'token' => $token,
            'redirect_url' => $redirectUrl,
        ];
    }

    /**
     * Fetch transaction status from Midtrans Core API (server-to-server).
     *
     * @return array<string, mixed>
     */
    public function getTransactionStatus(string $orderId): array
    {
        $serverKey = $this->requireServerKey();
        $endpoint = $this->getApiBaseUrl() . '/' . urlencode($orderId) . '/status';

        try {
            $response = Http::withBasicAuth($serverKey, '')
                ->acceptJson()
                ->timeout((int) config('midtrans.timeout_seconds', 15))
                ->get($endpoint);
        } catch (ConnectionException $e) {
            Log::error('Midtrans status check connection error', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            throw new PaymentException(
                'Tidak dapat terhubung ke Midtrans untuk memeriksa status transaksi.',
                502,
                $e
            );
        }

        if (! $response->successful()) {
            Log::warning('Midtrans status check failed', [
                'order_id' => $orderId,
                'http_status' => $response->status(),
            ]);

            throw new PaymentException(
                'Gagal memeriksa status transaksi ke Midtrans.',
                502
            );
        }

        $data = $response->json();

        if (! is_array($data) || empty($data['transaction_status'])) {
            throw new PaymentException('Format respons status Midtrans tidak valid.', 502);
        }

        return $data;
    }

    /**
     * Verify Midtrans webhook notification SHA-512 signature using Signature Secret Key.
     * Per Midtrans security guidelines (effective 28 Oct 2026), MIDTRANS_SIGNATURE_SECRET
     * is separate from MIDTRANS_SERVER_KEY and must not fall back to Server Key.
     */
    public function verifySignature(
        string $orderId,
        string $statusCode,
        string $grossAmount,
        string $signatureKey
    ): bool {
        $signatureSecret = trim((string) config('midtrans.signature_secret', ''));
        $incomingSignature = strtolower(trim($signatureKey));

        if ($signatureSecret === '' || $incomingSignature === '') {
            return false;
        }

        $expected = hash('sha512', $orderId . $statusCode . $grossAmount . $signatureSecret);

        return hash_equals($expected, $incomingSignature);
    }

    /**
     * Sanitize text sent to Midtrans item/customer fields.
     */
    public function sanitizeText(string $value, int $maxLength = 50): string
    {
        $cleaned = preg_replace('/[\r\n\t]+/', ' ', trim($value)) ?? '';

        if ((bool) config('midtrans.is_sanitized', true)) {
            $cleaned = preg_replace('/[^\p{L}\p{N}\s\-\.\,\:\(\)\/]/u', '', $cleaned) ?? $cleaned;
        }

        return mb_substr(trim($cleaned), 0, $maxLength);
    }

    protected function requireServerKey(): string
    {
        $serverKey = trim((string) config('midtrans.server_key', ''));

        if ($serverKey === '') {
            Log::error('Midtrans Server Key is not configured.');

            throw new PaymentException(
                'Konfigurasi gateway pembayaran Midtrans belum lengkap.',
                500
            );
        }

        return $serverKey;
    }
}
