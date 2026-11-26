<?php

namespace Tests\Unit;

use App\Exceptions\PaymentException;
use App\Services\MidtransService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransServiceTest extends TestCase
{
    protected MidtransService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new MidtransService();

        Config::set('midtrans.server_key', 'SB-Mid-server-TESTKEY123');
        Config::set('midtrans.signature_secret', 'TEST-SIGNATURE-SECRET-XYZ');
        Config::set('midtrans.client_key', 'SB-Mid-client-TESTCLIENT');
        Config::set('midtrans.is_production', false);
        Config::set('midtrans.is_sanitized', true);
    }

    public function test_uses_sandbox_urls_when_is_production_is_false(): void
    {
        $this->assertFalse($this->service->isProduction());
        $this->assertSame('https://app.sandbox.midtrans.com/snap/v1', $this->service->getSnapBaseUrl());
        $this->assertSame('https://api.sandbox.midtrans.com/v2', $this->service->getApiBaseUrl());
        $this->assertSame('https://app.sandbox.midtrans.com/snap/snap.js', $this->service->getSnapScriptUrl());
    }

    public function test_public_config_never_exposes_server_key_or_signature_secret(): void
    {
        $publicConfig = $this->service->getPublicConfig();

        $this->assertSame('SB-Mid-client-TESTCLIENT', $publicConfig['client_key']);
        $this->assertSame('https://app.sandbox.midtrans.com/snap/snap.js', $publicConfig['snap_script_url']);
        $this->assertFalse($publicConfig['is_production']);
        $this->assertArrayNotHasKey('server_key', $publicConfig);
        $this->assertArrayNotHasKey('signature_secret', $publicConfig);
    }

    public function test_create_snap_transaction_sends_basic_auth_and_returns_token(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-abc-123',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-abc-123',
            ], 201),
        ]);

        $result = $this->service->createSnapTransaction([
            'transaction_details' => [
                'order_id' => 'ITC-PAY-1-20261125-ABCDE',
                'gross_amount' => 100000,
            ],
        ]);

        $this->assertSame('snap-token-abc-123', $result['token']);
        $this->assertStringContainsString('snap-token-abc-123', $result['redirect_url']);

        Http::assertSent(function ($request) {
            $expectedAuth = 'Basic ' . base64_encode('SB-Mid-server-TESTKEY123:');

            return $request->url() === 'https://app.sandbox.midtrans.com/snap/v1/transactions'
                && $request->hasHeader('Authorization', $expectedAuth)
                && $request['transaction_details']['order_id'] === 'ITC-PAY-1-20261125-ABCDE';
        });
    }

    public function test_create_snap_transaction_throws_sanitized_exception_on_api_failure(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'error_messages' => ['Access denied due to unauthorized transaction'],
            ], 401),
        ]);

        try {
            $this->service->createSnapTransaction([
                'transaction_details' => ['order_id' => 'ITC-PAY-FAIL', 'gross_amount' => 50000],
            ]);
            $this->fail('Expected PaymentException was not thrown.');
        } catch (PaymentException $e) {
            $this->assertSame(502, $e->statusCode);
            $this->assertStringNotContainsString('SB-Mid-server-TESTKEY123', $e->getMessage());
        }
    }

    public function test_verify_signature_uses_signature_secret_and_never_falls_back_to_server_key(): void
    {
        $orderId = 'ITC-PAY-1-20261125-ABCDE';
        $statusCode = '200';
        $grossAmount = '100000.00';

        $validWithSignatureSecret = hash('sha512', $orderId . $statusCode . $grossAmount . 'TEST-SIGNATURE-SECRET-XYZ');
        $signedWithServerKey = hash('sha512', $orderId . $statusCode . $grossAmount . 'SB-Mid-server-TESTKEY123');

        $this->assertTrue($this->service->verifySignature($orderId, $statusCode, $grossAmount, $validWithSignatureSecret));
        $this->assertFalse($this->service->verifySignature($orderId, $statusCode, $grossAmount, $signedWithServerKey));
        $this->assertFalse($this->service->verifySignature($orderId, $statusCode, $grossAmount, 'tampered-signature'));

        // Empty signature secret must always return false (never fallback to server_key)
        Config::set('midtrans.signature_secret', '');
        $this->assertFalse($this->service->verifySignature($orderId, $statusCode, $grossAmount, $signedWithServerKey));
    }

    public function test_get_transaction_status_uses_server_key_basic_auth_and_returns_payload(): void
    {
        Http::fake([
            'https://api.sandbox.midtrans.com/v2/ITC-PAY-1-STATUS/status' => Http::response([
                'order_id' => 'ITC-PAY-1-STATUS',
                'transaction_status' => 'settlement',
                'status_code' => '200',
                'gross_amount' => '150000.00',
                'payment_type' => 'qris',
            ], 200),
        ]);

        $status = $this->service->getTransactionStatus('ITC-PAY-1-STATUS');

        $this->assertSame('settlement', $status['transaction_status']);
        $this->assertSame('150000.00', $status['gross_amount']);

        Http::assertSent(function ($request) {
            $expectedAuth = 'Basic ' . base64_encode('SB-Mid-server-TESTKEY123:');

            return $request->url() === 'https://api.sandbox.midtrans.com/v2/ITC-PAY-1-STATUS/status'
                && $request->hasHeader('Authorization', $expectedAuth);
        });
    }

    public function test_get_transaction_status_throws_sanitized_exception_on_error(): void
    {
        Http::fake([
            'https://api.sandbox.midtrans.com/v2/ITC-PAY-MISSING/status' => Http::response([
                'status_code' => '404',
                'status_message' => 'Transaction does not exist.',
            ], 404),
        ]);

        $this->expectException(PaymentException::class);
        $this->service->getTransactionStatus('ITC-PAY-MISSING');
    }
}
