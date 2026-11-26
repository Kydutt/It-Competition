<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Enums\TeamMemberRole;
use App\Models\ActivityLog;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\EventSetting;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\RegistrationFeeBackfillService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RegistrationFeeSnapshotAndManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $leader;

    protected User $member;

    protected User $individualUser;

    protected Event $event;

    protected CompetitionCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('midtrans.server_key', 'SB-Mid-server-TEST');
        Config::set('midtrans.signature_secret', 'TEST-SIG-SECRET');
        Config::set('midtrans.client_key', 'SB-Mid-client-TEST');
        Config::set('midtrans.is_production', false);
        Config::set('midtrans.expiry_minutes', 1440);

        $this->admin = User::factory()->create(['role' => Role::ADMIN, 'is_active' => true]);
        $this->leader = User::factory()->create(['role' => Role::PARTICIPANT, 'is_active' => true]);
        $this->member = User::factory()->create(['role' => Role::PARTICIPANT, 'is_active' => true]);
        $this->individualUser = User::factory()->create(['role' => Role::PARTICIPANT, 'is_active' => true]);

        $this->event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);
        $this->category = CompetitionCategory::factory()->create();

        EventSetting::create([
            'event_id' => $this->event->id,
            'setting_key' => 'payment_enabled',
            'setting_value' => 'true',
        ]);
    }

    protected function buildWebhookPayload(Payment $payment, array $overrides = []): array
    {
        $orderId = (string) ($overrides['order_id'] ?? $payment->order_id);
        $statusCode = (string) ($overrides['status_code'] ?? '200');
        $grossAmount = (string) ($overrides['gross_amount'] ?? number_format((float) $payment->amount, 2, '.', ''));
        $secret = (string) (config('midtrans.signature_secret') ?: config('midtrans.server_key'));
        $signatureKey = hash('sha512', $orderId . $statusCode . $grossAmount . $secret);

        return array_merge([
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signatureKey,
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
            'payment_type' => 'qris',
            'transaction_id' => 'midtrans-' . uniqid(),
            'settlement_time' => now()->format('Y-m-d H:i:s'),
        ], $overrides);
    }

    public function test_admin_competition_fee_validation_enforces_kb02_whole_integer_rupiah_and_defaults_empty_to_zero(): void
    {
        // Empty input on create defaults to 0 and logs registration_fee = 0.00 in activity_logs
        $createRes = $this->actingAs($this->admin)->postJson('/api/v1/admin/competitions', [
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'name' => 'Free Coding',
            'description' => 'Desc',
            'registration_type' => RegistrationType::INDIVIDUAL->value,
            'registration_start' => now()->subDay()->toDateString(),
            'registration_deadline' => now()->addDays(10)->toDateString(),
            'status' => CompetitionStatus::REGISTRATION_OPEN->value,
        ]);

        $createRes->assertStatus(201);
        $compId = $createRes->json('data.id');
        $this->assertSame('0.00', Competition::findOrFail($compId)->registration_fee);

        $createLog = ActivityLog::where('entity_type', 'Competition')
            ->where('entity_id', $compId)
            ->where('action', 'competition.create')
            ->first();
        $this->assertNotNull($createLog);
        $this->assertSame('0.00', $createLog->new_values['registration_fee'] ?? null);

        // Reject negative fee
        $this->actingAs($this->admin)->postJson('/api/v1/admin/competitions', [
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'name' => 'Neg Fee',
            'description' => 'Desc',
            'registration_type' => RegistrationType::INDIVIDUAL->value,
            'registration_fee' => -5000,
            'registration_start' => now()->toDateString(),
            'registration_deadline' => now()->addDays(10)->toDateString(),
        ])->assertStatus(422)->assertJsonValidationErrors(['registration_fee']);

        // Reject fractional Rupiah
        $this->actingAs($this->admin)->postJson('/api/v1/admin/competitions', [
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'name' => 'Decimal Fee',
            'description' => 'Desc',
            'registration_type' => RegistrationType::INDIVIDUAL->value,
            'registration_fee' => '50000.50',
            'registration_start' => now()->toDateString(),
            'registration_deadline' => now()->addDays(10)->toDateString(),
        ])->assertStatus(422)->assertJsonValidationErrors(['registration_fee']);

        // Update fee to valid integer Rupiah even with existing registrations logs change cleanly
        $this->actingAs($this->admin)->putJson("/api/v1/admin/competitions/{$compId}", [
            'registration_fee' => 75000,
        ])->assertStatus(200);

        $this->assertSame('75000.00', Competition::findOrFail($compId)->registration_fee);
        $this->assertDatabaseHas('activity_logs', [
            'entity_type' => 'Competition',
            'entity_id' => $compId,
            'action' => 'competition.update',
        ]);
    }

    public function test_new_individual_and_team_registrations_lock_fee_snapshot_at_creation(): void
    {
        $indComp = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'registration_type' => RegistrationType::INDIVIDUAL,
            'registration_fee' => 50000.00,
            'registration_start' => now()->subDay(),
            'registration_deadline' => now()->addDays(10),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        $teamComp = Competition::factory()->team(2, 3)->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'registration_fee' => 125000.00,
            'registration_start' => now()->subDay(),
            'registration_deadline' => now()->addDays(10),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        $indRes = $this->actingAs($this->individualUser)
            ->postJson('/api/v1/participant/registrations', ['competition_id' => $indComp->id]);

        $indRes->assertStatus(201)
            ->assertJsonPath('data.registration_fee_snapshot', 50000);
        $this->assertNotNull($indRes->json('data.fee_locked_at'));

        $team = Team::factory()->create([
            'leader_id' => $this->leader->id,
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->leader->id,
            'role' => TeamMemberRole::LEADER,
            'joined_at' => now(),
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->member->id,
            'role' => TeamMemberRole::MEMBER,
            'joined_at' => now(),
        ]);

        $teamRes = $this->actingAs($this->leader)
            ->postJson('/api/v1/participant/registrations', [
                'competition_id' => $teamComp->id,
                'team_id' => $team->id,
            ]);

        $teamRes->assertStatus(201)
            ->assertJsonPath('data.registration_fee_snapshot', 125000);

        // Team member also views exact team snapshot
        $teamRegId = $teamRes->json('data.id');
        $this->actingAs($this->member)
            ->getJson("/api/v1/participant/registrations/{$teamRegId}")
            ->assertOk()
            ->assertJsonPath('data.registration_fee_snapshot', 125000);
    }

    public function test_price_changes_after_registration_do_not_affect_old_registrants_checkout_pending_or_approval(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::sequence()
                ->push(['token' => 'snap-free-to-paid-new', 'redirect_url' => 'https://example.com/1'], 201)
                ->push(['token' => 'snap-old-50k', 'redirect_url' => 'https://example.com/2'], 201)
                ->push(['token' => 'snap-new-75k', 'redirect_url' => 'https://example.com/3'], 201),
        ]);

        // 1. Free (0) -> Paid (75000): old registrant stays free and can be approved without payment
        $comp = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'registration_type' => RegistrationType::INDIVIDUAL,
            'registration_fee' => 0.00,
            'registration_start' => now()->subDay(),
            'registration_deadline' => now()->addDays(10),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        $freeOldRegId = $this->actingAs($this->individualUser)
            ->postJson('/api/v1/participant/registrations', ['competition_id' => $comp->id])
            ->assertStatus(201)
            ->json('data.id');

        $freeOldReg = Registration::findOrFail($freeOldRegId);
        $freeOldReg->update(['status' => RegistrationStatus::SUBMITTED, 'submitted_at' => now()]);

        // Raise fee 0 -> 50000 -> 75000
        $this->actingAs($this->admin)->putJson("/api/v1/admin/competitions/{$comp->id}", ['registration_fee' => 50000])->assertOk();
        $old50kUser = User::factory()->create(['role' => Role::PARTICIPANT, 'is_active' => true]);
        $old50kRegId = $this->actingAs($old50kUser)
            ->postJson('/api/v1/participant/registrations', ['competition_id' => $comp->id])
            ->assertStatus(201)
            ->json('data.id');
        $old50kReg = Registration::findOrFail($old50kRegId);
        $old50kReg->update(['status' => RegistrationStatus::SUBMITTED, 'submitted_at' => now()]);

        // Change fee 50000 -> 75000 -> 30000
        $this->actingAs($this->admin)->putJson("/api/v1/admin/competitions/{$comp->id}", ['registration_fee' => 75000])->assertOk();
        $this->actingAs($this->admin)->putJson("/api/v1/admin/competitions/{$comp->id}", ['registration_fee' => 30000])->assertOk();

        // Free old registrant cannot checkout (still free) & CAN be approved by admin without payment
        $this->actingAs($this->individualUser)
            ->postJson("/api/v1/participant/registrations/{$freeOldRegId}/payments")
            ->assertStatus(422);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/registrations/{$freeOldRegId}/status", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        // 50k old registrant still checks out at 50000 even though competition fee is now 30000
        $checkout50k = $this->actingAs($old50kUser)
            ->postJson("/api/v1/participant/registrations/{$old50kRegId}/payments")
            ->assertStatus(201);
        $checkout50k->assertJsonPath('data.amount', 50000);

        // Even after changing fee again, pending payment at 50000 is reused (not cancelled!)
        $this->actingAs($this->admin)->putJson("/api/v1/admin/competitions/{$comp->id}", ['registration_fee' => 0])->assertOk();

        $reuse50k = $this->actingAs($old50kUser)
            ->postJson("/api/v1/participant/registrations/{$old50kRegId}/payments")
            ->assertStatus(200);
        $reuse50k->assertJsonPath('data.id', $checkout50k->json('data.id'));
        $reuse50k->assertJsonPath('data.amount', 50000);

        // And because snapshot is 50000 (>0), dropping competition fee to 0 does NOT bypass PD-02 approval requirement!
        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/registrations/{$old50kRegId}/status", ['status' => 'approved'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payment']);
    }

    public function test_unresolved_null_snapshot_rejects_both_checkout_and_approval_without_fallback(): void
    {
        $comp = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'registration_fee' => 50000.00,
        ]);

        $legacyAmbiguous = Registration::factory()->withoutFeeSnapshot()->submitted()->create([
            'competition_id' => $comp->id,
            'participant_id' => $this->individualUser->id,
        ]);

        $this->assertNull($legacyAmbiguous->effectiveRegistrationFeeRupiah());

        // Checkout rejected cleanly with 422
        $this->actingAs($this->individualUser)
            ->postJson("/api/v1/participant/registrations/{$legacyAmbiguous->id}/payments")
            ->assertStatus(422);

        // Approval rejected cleanly with 422 (even if competition later dropped to 0!)
        $comp->update(['registration_fee' => 0.00]);
        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/registrations/{$legacyAmbiguous->id}/status", ['status' => 'approved'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payment']);
    }

    public function test_partial_refund_and_duplicate_webhook_use_registration_snapshot_not_latest_competition_fee(): void
    {
        $comp = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'registration_fee' => 50000.00,
        ]);

        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $comp->id,
            'participant_id' => $this->individualUser->id,
            'registration_fee_snapshot' => '50000.00',
        ]);

        $payment = Payment::factory()->create([
            'registration_id' => $reg->id,
            'user_id' => $this->individualUser->id,
            'order_id' => 'ITC-PAY-SNAP-PARTIAL',
            'amount' => 50000.00,
            'status' => PaymentStatus::PENDING,
        ]);

        // Competition fee drops to 20000 AFTER registration & settlement
        $comp->update(['registration_fee' => 20000.00]);

        // Settlement succeeds + duplicate webhook is idempotent
        $settlementPayload = $this->buildWebhookPayload($payment, ['transaction_status' => 'settlement']);
        $this->postJson('/api/v1/webhooks/midtrans', $settlementPayload)->assertOk()->assertJsonPath('data.status', 'paid');
        $this->postJson('/api/v1/webhooks/midtrans', $settlementPayload)->assertOk()->assertJsonPath('data.status', 'paid');

        // Partial refund of 20000 leaves net 30000. Current comp fee is 20000, BUT snapshot is 50000 -> MUST reject!
        $partialPayload = $this->buildWebhookPayload($payment, [
            'transaction_status' => 'partial_refund',
            'fraud_status' => null,
            'refund_amount' => '20000.00',
            'refund_key' => 'rf-snap-1',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $partialPayload)
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->assertFalse($reg->fresh()->hasPaidPayment());
        $this->assertSame(30000, (int) $payment->fresh()->webhook_payload['net_paid_amount']);

        // Full refund also reverts paid eligibility and preserves registration snapshot + paid_at
        $uFull = User::factory()->create(['role' => Role::PARTICIPANT, 'is_active' => true]);
        $regFull = Registration::factory()->submitted()->create([
            'competition_id' => $comp->id,
            'participant_id' => $uFull->id,
            'registration_fee_snapshot' => '50000.00',
        ]);
        $fullPay = Payment::factory()->paid()->create([
            'registration_id' => $regFull->id,
            'user_id' => $uFull->id,
            'order_id' => 'ITC-PAY-SNAP-FULLREF',
            'amount' => 50000.00,
        ]);

        $fullRefundPayload = $this->buildWebhookPayload($fullPay, [
            'transaction_status' => 'refund',
            'fraud_status' => null,
            'refund_amount' => '50000.00',
            'refund_key' => 'rf-full-snap-1',
        ]);

        $this->postJson('/api/v1/webhooks/midtrans', $fullRefundPayload)
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertFalse($regFull->fresh()->hasPaidPayment());
        $this->assertSame(50000, $regFull->fresh()->effectiveRegistrationFeeRupiah());
    }

    public function test_conservative_backfill_follows_corrected_tier1_tier2_tier3_and_is_idempotent(): void
    {
        // Nov 1: Admin creates competition at 50000 cleanly via Admin endpoint (logs competition.create = 50000)
        $this->travelTo(now()->startOfDay()->setDate(2026, 11, 1)->setTime(10, 0, 0));

        $compId = $this->actingAs($this->admin)->postJson('/api/v1/admin/competitions', [
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'name' => 'Backfill Audited Comp',
            'description' => 'Desc',
            'registration_type' => RegistrationType::INDIVIDUAL->value,
            'registration_fee' => 50000,
            'registration_start' => '2026-10-25 00:00:00',
            'registration_deadline' => '2026-12-30 00:00:00',
            'status' => CompetitionStatus::REGISTRATION_OPEN->value,
        ])->assertStatus(201)->json('data.id');

        // Nov 10: User registers while competition fee is 50000
        $this->travelTo(now()->startOfDay()->setDate(2026, 11, 10)->setTime(10, 0, 0));
        $regBeforeChangeWithNewPayment = Registration::factory()->withoutFeeSnapshot()->create([
            'competition_id' => $compId,
            'participant_id' => $this->individualUser->id,
        ]);

        // Nov 12: Admin raises competition fee 50000 -> 75000
        $this->travelTo(now()->startOfDay()->setDate(2026, 11, 12)->setTime(10, 0, 0));
        $this->actingAs($this->admin)->putJson("/api/v1/admin/competitions/{$compId}", [
            'registration_fee' => 75000,
        ])->assertOk();

        // Nov 13: Second user registers while competition fee is 75000
        $this->travelTo(now()->startOfDay()->setDate(2026, 11, 13)->setTime(10, 0, 0));
        $u2 = User::factory()->create(['role' => Role::PARTICIPANT]);
        $regAfterChange = Registration::factory()->withoutFeeSnapshot()->create([
            'competition_id' => $compId,
            'participant_id' => $u2->id,
        ]);

        // Nov 14: First user created a payment at the newer 75000 fee (Corrected Tier 1 must NOT use 75000!)
        $this->travelTo(now()->startOfDay()->setDate(2026, 11, 14)->setTime(10, 0, 0));
        Payment::factory()->paid()->create([
            'registration_id' => $regBeforeChangeWithNewPayment->id,
            'user_id' => $this->individualUser->id,
            'amount' => 75000.00,
        ]);

        // Case 3: Ambiguous competition without competition.create log -> MUST stay NULL
        $unloggedComp = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'registration_fee' => 90000.00,
        ]);
        $ambiguousReg = Registration::factory()->withoutFeeSnapshot()->create([
            'competition_id' => $unloggedComp->id,
            'participant_id' => $this->leader->id,
        ]);

        $this->travelBack();

        $service = app(RegistrationFeeBackfillService::class);
        $report1 = $service->runGeneralBackfill(false);

        $this->assertSame(2, $report1['backfilled_count']);
        $this->assertSame(1, $report1['ambiguous_count']);
        $this->assertSame(50000, $regBeforeChangeWithNewPayment->fresh()->effectiveRegistrationFeeRupiah());
        $this->assertSame(75000, $regAfterChange->fresh()->effectiveRegistrationFeeRupiah());
        $this->assertNull($ambiguousReg->fresh()->registration_fee_snapshot);

        // Idempotent second run changes 0 rows and keeps ambiguousReg NULL
        $report2 = $service->runGeneralBackfill(false);
        $this->assertSame(0, $report2['backfilled_count']);
        $this->assertSame(1, $report2['ambiguous_count']);

        // Controlled confirmation command resolves ambiguousReg explicitly with ActivityLog entry
        $this->artisan('registrations:confirm-fee-snapshot', [
            '--ids' => (string) $ambiguousReg->id,
            '--fee' => '90000',
            '--reason' => 'Audit test confirmation',
        ])->assertExitCode(0);

        $this->assertSame(90000, $ambiguousReg->fresh()->effectiveRegistrationFeeRupiah());
        $this->assertDatabaseHas('activity_logs', [
            'entity_type' => 'Registration',
            'entity_id' => $ambiguousReg->id,
            'action' => 'registration.fee_snapshot_confirmed',
        ]);
    }
}
