<?php

namespace Tests\Feature;

use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Models\ActivityLog;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\EventSetting;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class MidtransWebhookAndReconciliationTest extends TestCase
{
    use RefreshDatabase;

    protected User $participant;
    protected User $stranger;
    protected Event $event;
    protected Competition $competition;
    protected Registration $registration;
    protected Payment $payment;

    protected string $signatureSecret = 'TEST-SIGNATURE-SECRET-PHASE2';
    protected string $serverKey = 'SB-Mid-server-PHASE2-KEY';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('midtrans.server_key', $this->serverKey);
        Config::set('midtrans.signature_secret', $this->signatureSecret);
        Config::set('midtrans.client_key', 'SB-Mid-client-PHASE2-KEY');
        Config::set('midtrans.is_production', false);

        $this->participant = User::factory()->create([
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        $this->stranger = User::factory()->create([
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        $this->event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);
        $category = CompetitionCategory::factory()->create();

        EventSetting::create([
            'event_id' => $this->event->id,
            'setting_key' => 'payment_enabled',
            'setting_value' => 'true',
        ]);

        $this->competition = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $category->id,
            'name' => 'UI/UX Competition',
            'registration_type' => RegistrationType::INDIVIDUAL,
            'registration_fee' => 150000.00,
            'registration_start' => now()->subDays(2),
            'registration_deadline' => now()->addDays(10),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        $this->registration = Registration::factory()->submitted()->create([
            'competition_id' => $this->competition->id,
            'participant_id' => $this->participant->id,
        ]);

        $this->payment = Payment::factory()->create([
            'registration_id' => $this->registration->id,
            'user_id' => $this->participant->id,
            'order_id' => 'ITC-PAY-100-20261126-PHASE2',
            'amount' => 150000.00,
            'status' => PaymentStatus::PENDING,
            'expired_at' => now()->addHours(24),
        ]);
    }

    /**
     * Build signed Midtrans notification payload following Oct 28, 2026 spec:
     * SHA512(order_id + status_code + gross_amount + SignatureSecretKey)
     *
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function buildWebhookPayload(array $overrides = [], ?string $secretOverride = null): array
    {
        $payload = array_merge([
            'order_id' => $this->payment->order_id,
            'status_code' => '200',
            'gross_amount' => '150000.00',
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
            'payment_type' => 'qris',
            'transaction_id' => 'midtrans-tx-001',
            'settlement_time' => now()->format('Y-m-d H:i:s'),
        ], $overrides);

        if (! array_key_exists('signature_key', $overrides)) {
            $secret = $secretOverride ?? $this->signatureSecret;
            $payload['signature_key'] = hash(
                'sha512',
                $payload['order_id'] . $payload['status_code'] . $payload['gross_amount'] . $secret
            );
        }

        return $payload;
    }

    public function test_1_valid_signature_processes_webhook_without_sanctum_auth(): void
    {
        $payload = $this->buildWebhookPayload([
            'transaction_status' => 'capture',
            'fraud_status' => 'accept',
            'payment_type' => 'credit_card',
        ]);

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.order_id', $this->payment->order_id)
            ->assertJsonPath('data.status', 'paid');

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'paid',
            'payment_type' => 'credit_card',
            'midtrans_transaction_status' => 'capture',
            'fraud_status' => 'accept',
        ]);
    }

    public function test_2_invalid_signature_or_server_key_signature_is_rejected_with_403(): void
    {
        // Signed using Server Key instead of Signature Secret Key -> MUST fail
        $serverKeySigned = $this->buildWebhookPayload([], $this->serverKey);

        $this->postJson('/api/v1/webhooks/midtrans', $serverKeySigned)
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        // Tampered signature string
        $tampered = $this->buildWebhookPayload(['signature_key' => str_repeat('a', 128)]);

        $this->postJson('/api/v1/webhooks/midtrans', $tampered)
            ->assertStatus(403);

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'pending',
        ]);
    }

    public function test_3_empty_signature_secret_fails_safely(): void
    {
        Config::set('midtrans.signature_secret', '');

        $payload = $this->buildWebhookPayload([], $this->serverKey);

        $this->postJson('/api/v1/webhooks/midtrans', $payload)
            ->assertStatus(403)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'pending',
        ]);
    }

    public function test_4_unknown_order_id_returns_404(): void
    {
        $payload = $this->buildWebhookPayload([
            'order_id' => 'ITC-PAY-UNKNOWN-999',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $payload)
            ->assertStatus(404)
            ->assertJsonPath('success', false);
    }

    public function test_5_mismatched_gross_amount_is_rejected_and_does_not_mark_paid(): void
    {
        $payload = $this->buildWebhookPayload([
            'gross_amount' => '1000.00',
            'transaction_status' => 'settlement',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $payload)
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->payment->refresh();
        $this->assertSame(PaymentStatus::PENDING, $this->payment->status);
        $this->assertNull($this->payment->paid_at);
    }

    public function test_6_settlement_notification_marks_payment_paid_and_creates_audit_and_notification(): void
    {
        $payload = $this->buildWebhookPayload([
            'transaction_status' => 'settlement',
            'payment_type' => 'bank_transfer',
            'transaction_id' => 'midtrans-settlement-123',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $payload)
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->payment->refresh();
        $this->assertSame(PaymentStatus::PAID, $this->payment->status);
        $this->assertNotNull($this->payment->paid_at);
        $this->assertNotNull($this->payment->last_webhook_at);
        $this->assertSame('midtrans-settlement-123', $this->payment->midtrans_transaction_id);

        $this->assertDatabaseHas('activity_logs', [
            'entity_type' => 'Payment',
            'entity_id' => $this->payment->id,
            'action' => 'payment.status_updated',
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->participant->id,
            'type' => 'payment',
        ]);
    }

    public function test_7_pending_notification_keeps_payment_pending_and_updates_metadata(): void
    {
        $payload = $this->buildWebhookPayload([
            'status_code' => '201',
            'transaction_status' => 'pending',
            'fraud_status' => null,
            'payment_type' => 'echannel',
            'transaction_id' => 'midtrans-pending-01',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $payload)
            ->assertOk()
            ->assertJsonPath('data.status', 'pending');

        $this->payment->refresh();
        $this->assertSame(PaymentStatus::PENDING, $this->payment->status);
        $this->assertSame('echannel', $this->payment->payment_type);
        $this->assertNull($this->payment->paid_at);
    }

    public function test_8_expire_notification_marks_payment_expired(): void
    {
        $payload = $this->buildWebhookPayload([
            'status_code' => '202',
            'transaction_status' => 'expire',
            'fraud_status' => null,
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $payload)
            ->assertOk()
            ->assertJsonPath('data.status', 'expired');

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'expired',
            'midtrans_transaction_status' => 'expire',
        ]);
    }

    public function test_9_cancel_notification_marks_payment_cancelled(): void
    {
        $payload = $this->buildWebhookPayload([
            'status_code' => '200',
            'transaction_status' => 'cancel',
            'fraud_status' => null,
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $payload)
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'cancelled',
            'midtrans_transaction_status' => 'cancel',
        ]);
    }

    public function test_10_deny_notification_marks_payment_failed(): void
    {
        $payload = $this->buildWebhookPayload([
            'status_code' => '202',
            'transaction_status' => 'deny',
            'fraud_status' => 'deny',
            'payment_type' => 'credit_card',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $payload)
            ->assertOk()
            ->assertJsonPath('data.status', 'failed');

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'failed',
            'midtrans_transaction_status' => 'deny',
        ]);
    }

    public function test_11_capture_with_fraud_challenge_never_marks_paid(): void
    {
        $challengePayload = $this->buildWebhookPayload([
            'transaction_status' => 'capture',
            'fraud_status' => 'challenge',
            'payment_type' => 'credit_card',
            'transaction_id' => 'midtrans-fds-01',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $challengePayload)
            ->assertOk()
            ->assertJsonPath('data.status', 'pending');

        $this->payment->refresh();
        $this->assertSame(PaymentStatus::PENDING, $this->payment->status);
        $this->assertSame('challenge', $this->payment->fraud_status);
        $this->assertNull($this->payment->paid_at);

        $this->assertDatabaseHas('activity_logs', [
            'entity_type' => 'Payment',
            'entity_id' => $this->payment->id,
            'action' => 'payment.fraud_challenge',
        ]);

        // Later FDS accepts -> upgrades to paid cleanly
        $acceptPayload = $this->buildWebhookPayload([
            'transaction_status' => 'capture',
            'fraud_status' => 'accept',
            'payment_type' => 'credit_card',
            'transaction_id' => 'midtrans-fds-01',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $acceptPayload)
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');
    }

    public function test_12_duplicate_webhooks_are_idempotent_without_repeated_side_effects(): void
    {
        $payload = $this->buildWebhookPayload([
            'transaction_status' => 'settlement',
            'transaction_id' => 'midtrans-dup-01',
            'settlement_time' => '2026-11-26 10:00:00',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $payload)->assertOk();
        $firstPaidAt = $this->payment->fresh()->paid_at;

        // Send exact duplicate 2 more times
        $this->postJson('/api/v1/webhooks/midtrans', $payload)->assertOk();
        $this->postJson('/api/v1/webhooks/midtrans', $payload)->assertOk();

        $this->assertEquals($firstPaidAt, $this->payment->fresh()->paid_at);
        $this->assertSame(1, ActivityLog::where('entity_type', 'Payment')
            ->where('entity_id', $this->payment->id)
            ->where('action', 'payment.status_updated')
            ->count());
        $this->assertSame(1, Notification::where('user_id', $this->participant->id)
            ->where('type', 'payment')
            ->count());
    }

    public function test_13_out_of_order_notifications_do_not_downgrade_paid_payment(): void
    {
        // Settlement arrives first
        $settlement = $this->buildWebhookPayload([
            'transaction_status' => 'settlement',
            'transaction_id' => 'midtrans-ooo-1',
        ]);
        $this->postJson('/api/v1/webhooks/midtrans', $settlement)->assertOk();

        // Delayed pending and expire arrive later out-of-order
        $latePending = $this->buildWebhookPayload([
            'status_code' => '201',
            'transaction_status' => 'pending',
            'fraud_status' => null,
            'transaction_id' => 'midtrans-ooo-1',
        ]);
        $lateExpire = $this->buildWebhookPayload([
            'status_code' => '202',
            'transaction_status' => 'expire',
            'fraud_status' => null,
            'transaction_id' => 'midtrans-ooo-1',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $latePending)
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->postJson('/api/v1/webhooks/midtrans', $lateExpire)
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'paid',
        ]);
    }

    public function test_14_final_non_paid_statuses_are_not_overwritten_by_stale_notifications(): void
    {
        $this->payment->update([
            'status' => PaymentStatus::EXPIRED,
            'midtrans_transaction_status' => 'expire',
        ]);

        $stalePending = $this->buildWebhookPayload([
            'status_code' => '201',
            'transaction_status' => 'pending',
            'fraud_status' => null,
        ]);

        $staleCancel = $this->buildWebhookPayload([
            'status_code' => '200',
            'transaction_status' => 'cancel',
            'fraud_status' => null,
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $stalePending)
            ->assertOk()
            ->assertJsonPath('data.status', 'expired');

        $this->postJson('/api/v1/webhooks/midtrans', $staleCancel)
            ->assertOk()
            ->assertJsonPath('data.status', 'expired');

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'expired',
        ]);
    }

    public function test_15_database_rolls_back_when_processing_fails(): void
    {
        // Trigger a DB failure right after Payment::update during ActivityLog insertion
        ActivityLog::creating(function () {
            throw new RuntimeException('Simulated database failure');
        });

        $payload = $this->buildWebhookPayload([
            'transaction_status' => 'settlement',
        ]);

        try {
            $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);
            $response->assertStatus(500);
        } finally {
            ActivityLog::flushEventListeners();
        }

        // Payment update MUST have rolled back cleanly to pending
        $this->payment->refresh();
        $this->assertSame(PaymentStatus::PENDING, $this->payment->status);
        $this->assertNull($this->payment->paid_at);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_16_webhook_never_automatically_approves_registration(): void
    {
        $payload = $this->buildWebhookPayload([
            'transaction_status' => 'settlement',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $payload)
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->registration->refresh();
        $this->assertSame(RegistrationStatus::SUBMITTED, $this->registration->status);
        $this->assertNull($this->registration->verified_at);
        $this->assertNull($this->registration->verified_by);
    }

    public function test_17_one_registration_cannot_obtain_two_successful_payments(): void
    {
        $secondPending = Payment::factory()->create([
            'registration_id' => $this->registration->id,
            'user_id' => $this->participant->id,
            'order_id' => 'ITC-PAY-100-20261126-SECOND',
            'amount' => 150000.00,
            'status' => PaymentStatus::PENDING,
            'expired_at' => now()->addHours(24),
        ]);

        // First payment settles -> succeeds
        $firstPayload = $this->buildWebhookPayload([
            'order_id' => $this->payment->order_id,
            'transaction_status' => 'settlement',
        ]);
        $this->postJson('/api/v1/webhooks/midtrans', $firstPayload)->assertOk();

        // Second payment also attempts settlement -> blocked with 409; history preserved as cancelled
        $secondPayload = $this->buildWebhookPayload([
            'order_id' => $secondPending->order_id,
            'transaction_status' => 'settlement',
        ]);
        $this->postJson('/api/v1/webhooks/midtrans', $secondPayload)
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        // Retrying the same conflicting settlement returns idempotent 200 without HTTP 500
        $this->postJson('/api/v1/webhooks/midtrans', $secondPayload)
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertSame(
            1,
            Payment::where('registration_id', $this->registration->id)
                ->whereIn('status', [PaymentStatus::PAID->value, PaymentStatus::VERIFIED->value])
                ->count()
        );
        $secondFresh = $secondPending->fresh();
        $this->assertSame(PaymentStatus::CANCELLED, $secondFresh->status);
        $this->assertSame('settlement', $secondFresh->midtrans_transaction_status);
        $this->assertNotEmpty($secondFresh->rejection_reason);
        $this->assertSame(RegistrationStatus::SUBMITTED, $this->registration->fresh()->status);
        $this->assertDatabaseHas('activity_logs', [
            'entity_type' => 'Payment',
            'entity_id' => $secondPending->id,
            'action' => 'payment.duplicate_paid_blocked',
        ]);
    }

    public function test_unique_constraint_query_exception_is_handled_explicitly_without_http_500(): void
    {
        $secondPending = Payment::factory()->create([
            'registration_id' => $this->registration->id,
            'user_id' => $this->participant->id,
            'order_id' => 'ITC-PAY-100-20261126-RACE',
            'amount' => 150000.00,
            'status' => PaymentStatus::PENDING,
            'expired_at' => now()->addHours(24),
        ]);

        // Simulate concurrent MySQL unique constraint (1062 uq_payment_single_paid_registration) firing during update
        Payment::updating(function (Payment $model) use ($secondPending) {
            if ($model->id === $secondPending->id && $model->status === PaymentStatus::PAID) {
                $pdoException = new \PDOException("SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry '1' for key 'payments.uq_payment_single_paid_registration'");
                $pdoException->errorInfo = ['23000', 1062, "Duplicate entry '1' for key 'payments.uq_payment_single_paid_registration'"];

                throw new \Illuminate\Database\QueryException('mysql', 'update payments set status = ?', [], $pdoException);
            }
        });

        $payload = $this->buildWebhookPayload([
            'order_id' => $secondPending->order_id,
            'transaction_status' => 'settlement',
        ]);

        try {
            $this->postJson('/api/v1/webhooks/midtrans', $payload)
                ->assertStatus(409)
                ->assertJsonPath('success', false);
        } finally {
            Payment::flushEventListeners();
        }

        // Subsequent retry must remain idempotent and never return HTTP 500
        $this->postJson('/api/v1/webhooks/midtrans', $payload)
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertSame(PaymentStatus::CANCELLED, $secondPending->fresh()->status);
        $this->assertDatabaseHas('activity_logs', [
            'entity_type' => 'Payment',
            'entity_id' => $secondPending->id,
            'action' => 'payment.duplicate_paid_blocked',
        ]);
    }

    public function test_explicit_handling_for_refund_partial_refund_and_chargeback_preserves_history(): void
    {
        // 1. Full refund -> cancelled, net_paid_amount = 0, history & paid_at preserved, registration ineligible
        $this->postJson('/api/v1/webhooks/midtrans', $this->buildWebhookPayload([
            'transaction_status' => 'settlement',
            'transaction_id' => 'midtrans-ref-1',
        ]))->assertOk();

        $this->assertTrue($this->registration->fresh()->hasPaidPayment());

        $this->postJson('/api/v1/webhooks/midtrans', $this->buildWebhookPayload([
            'transaction_status' => 'refund',
            'transaction_id' => 'midtrans-ref-1',
            'refund_amount' => '150000.00',
            'refund_key' => 'rf-full-1',
        ]))->assertOk()->assertJsonPath('data.status', 'cancelled');

        $this->payment->refresh();
        $this->assertSame(PaymentStatus::CANCELLED, $this->payment->status);
        $this->assertSame('refund', $this->payment->midtrans_transaction_status);
        $this->assertNotNull($this->payment->paid_at);
        $this->assertSame(150000, (int) $this->payment->webhook_payload['cumulative_refunded_amount']);
        $this->assertSame(0, (int) $this->payment->webhook_payload['net_paid_amount']);
        $this->assertFalse($this->registration->fresh()->hasPaidPayment());
        $this->assertDatabaseHas('activity_logs', [
            'entity_type' => 'Payment',
            'entity_id' => $this->payment->id,
            'action' => 'payment.refund',
        ]);

        // 2. Partial refund below competition fee -> rejected (distinct from full refund cancelled)
        //    tracks refund_amount & net_paid_amount, accumulates multiple refund_keys, deduplicates repeats
        $partialUser = User::factory()->create(['role' => Role::PARTICIPANT, 'is_active' => true]);
        $reg2 = Registration::factory()->submitted()->create([
            'competition_id' => $this->competition->id,
            'participant_id' => $partialUser->id,
        ]);
        $prPayment = Payment::factory()->paid()->create([
            'registration_id' => $reg2->id,
            'user_id' => $partialUser->id,
            'order_id' => 'ITC-PAY-300-PARTIALREF',
            'amount' => 150000.00,
        ]);

        $partial1 = $this->buildWebhookPayload([
            'order_id' => $prPayment->order_id,
            'transaction_status' => 'partial_refund',
            'fraud_status' => null,
            'refund_amount' => '50000.00',
            'refund_key' => 'rf-part-1',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $partial1)
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $prPayment->refresh();
        $this->assertSame(PaymentStatus::REJECTED, $prPayment->status);
        $this->assertSame('partial_refund', $prPayment->midtrans_transaction_status);
        $this->assertSame(50000, (int) $prPayment->webhook_payload['cumulative_refunded_amount']);
        $this->assertSame(100000, (int) $prPayment->webhook_payload['net_paid_amount']);
        $this->assertCount(1, $prPayment->webhook_payload['reversal_history']);
        $this->assertFalse($reg2->fresh()->hasPaidPayment());

        // Duplicate delivery of rf-part-1 -> idempotent (cumulative stays 50000)
        $this->postJson('/api/v1/webhooks/midtrans', $partial1)->assertOk();
        $this->assertSame(50000, (int) $prPayment->fresh()->webhook_payload['cumulative_refunded_amount']);
        $this->assertCount(1, $prPayment->fresh()->webhook_payload['reversal_history']);

        // Second distinct partial refund rf-part-2 -> accumulates to 80000, net = 70000
        $partial2 = $this->buildWebhookPayload([
            'order_id' => $prPayment->order_id,
            'transaction_status' => 'partial_refund',
            'fraud_status' => null,
            'refund_amount' => '30000.00',
            'refund_key' => 'rf-part-2',
        ]);
        $this->postJson('/api/v1/webhooks/midtrans', $partial2)->assertOk();
        $this->assertSame(80000, (int) $prPayment->fresh()->webhook_payload['cumulative_refunded_amount']);
        $this->assertSame(70000, (int) $prPayment->fresh()->webhook_payload['net_paid_amount']);
        $this->assertCount(2, $prPayment->fresh()->webhook_payload['reversal_history']);
        $this->assertDatabaseHas('activity_logs', [
            'entity_type' => 'Payment',
            'entity_id' => $prPayment->id,
            'action' => 'payment.partial_refund',
        ]);

        // PaymentResource exposes sanitized reversal fields without leaking raw webhook_payload
        $this->actingAs($partialUser)
            ->getJson("/api/v1/participant/payments/{$prPayment->id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.midtrans_transaction_status', 'partial_refund')
            ->assertJsonPath('data.cumulative_refunded_amount', 80000)
            ->assertJsonPath('data.net_paid_amount', 70000)
            ->assertJsonCount(2, 'data.reversal_history')
            ->assertJsonMissingPath('data.webhook_payload')
            ->assertJsonMissingPath('data.signature_key');

        // 3. Partial refund where net_paid_amount STILL covers competition registration_fee -> stays paid!
        $lowerFeeComp = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->competition->category_id,
            'name' => 'Discounted Tier Contest',
            'registration_type' => RegistrationType::INDIVIDUAL,
            'registration_fee' => 100000.00,
            'registration_start' => now()->subDays(2),
            'registration_deadline' => now()->addDays(10),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);
        $regNetValid = Registration::factory()->submitted()->create([
            'competition_id' => $lowerFeeComp->id,
            'participant_id' => $this->stranger->id,
        ]);
        $netValidPayment = Payment::factory()->paid()->create([
            'registration_id' => $regNetValid->id,
            'user_id' => $this->stranger->id,
            'order_id' => 'ITC-PAY-350-NETVALID',
            'amount' => 150000.00,
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $this->buildWebhookPayload([
            'order_id' => $netValidPayment->order_id,
            'transaction_status' => 'partial_refund',
            'fraud_status' => null,
            'refund_amount' => '40000.00',
            'refund_key' => 'rf-part-netvalid',
        ]))->assertOk()->assertJsonPath('data.status', 'paid');

        $this->assertSame(110000, (int) $netValidPayment->fresh()->webhook_payload['net_paid_amount']);
        $this->assertTrue($regNetValid->fresh()->hasPaidPayment());

        // 4. Chargeback & partial_chargeback -> failed (distinct from refund/partial_refund) and revokes paid
        $regCb = Registration::factory()->submitted()->create([
            'competition_id' => $this->competition->id,
            'participant_id' => $this->stranger->id,
        ]);
        $cbPayment = Payment::factory()->paid()->create([
            'registration_id' => $regCb->id,
            'user_id' => $this->stranger->id,
            'order_id' => 'ITC-PAY-200-CHARGEBACK',
            'amount' => 150000.00,
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $this->buildWebhookPayload([
            'order_id' => $cbPayment->order_id,
            'transaction_status' => 'chargeback',
            'fraud_status' => null,
            'refund_chargeback_id' => 901,
        ]))->assertOk()->assertJsonPath('data.status', 'failed');

        $this->assertSame('chargeback', $cbPayment->fresh()->midtrans_transaction_status);
        $this->assertFalse($regCb->fresh()->hasPaidPayment());
        $this->assertDatabaseHas('activity_logs', [
            'entity_type' => 'Payment',
            'entity_id' => $cbPayment->id,
            'action' => 'payment.chargeback',
        ]);
    }

    public function test_participant_sync_reconciles_missed_settlement_via_midtrans_status_api(): void
    {
        Http::fake([
            "https://api.sandbox.midtrans.com/v2/{$this->payment->order_id}/status" => Http::response([
                'order_id' => $this->payment->order_id,
                'status_code' => '200',
                'gross_amount' => '150000.00',
                'transaction_status' => 'settlement',
                'fraud_status' => 'accept',
                'payment_type' => 'qris',
                'transaction_id' => 'midtrans-sync-001',
                'settlement_time' => now()->format('Y-m-d H:i:s'),
            ], 200),
        ]);

        // Stranger is forbidden
        $this->actingAs($this->stranger)
            ->postJson("/api/v1/participant/payments/{$this->payment->id}/sync")
            ->assertStatus(403);

        // Owner syncs status cleanly
        $response = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/payments/{$this->payment->id}/sync");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.payment_type', 'qris');

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'paid',
            'midtrans_transaction_id' => 'midtrans-sync-001',
        ]);

        // Registration status stays submitted
        $this->assertSame(RegistrationStatus::SUBMITTED, $this->registration->fresh()->status);
    }

    public function test_sync_rejects_mismatched_gateway_amount_without_changing_local_status(): void
    {
        Http::fake([
            "https://api.sandbox.midtrans.com/v2/{$this->payment->order_id}/status" => Http::response([
                'order_id' => $this->payment->order_id,
                'status_code' => '200',
                'gross_amount' => '10000.00',
                'transaction_status' => 'settlement',
            ], 200),
        ]);

        $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/payments/{$this->payment->id}/sync")
            ->assertStatus(422);

        $this->assertSame(PaymentStatus::PENDING, $this->payment->fresh()->status);
    }
}
