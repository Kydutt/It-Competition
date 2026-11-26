<?php

namespace Tests\Feature;

use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Enums\TeamMemberRole;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\EventSetting;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ParticipantPaymentApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $participant;
    protected User $teamMember;
    protected User $stranger;
    protected Event $event;
    protected Competition $paidIndividualComp;
    protected Competition $paidTeamComp;
    protected Competition $freeIndividualComp;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('midtrans.server_key', 'SB-Mid-server-TEST');
        Config::set('midtrans.signature_secret', 'TEST-SIG-SECRET');
        Config::set('midtrans.client_key', 'SB-Mid-client-TEST');
        Config::set('midtrans.is_production', false);
        Config::set('midtrans.expiry_minutes', 1440);

        $this->admin = User::factory()->create([
            'role' => Role::ADMIN,
            'is_active' => true,
        ]);

        $this->participant = User::factory()->create([
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        $this->teamMember = User::factory()->create([
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

        $this->paidIndividualComp = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $category->id,
            'name' => 'Paid Individual Contest',
            'registration_type' => RegistrationType::INDIVIDUAL,
            'registration_fee' => 150000.00,
            'registration_start' => now()->subDays(2),
            'registration_deadline' => now()->addDays(10),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        $this->paidTeamComp = Competition::factory()->team(2, 3)->create([
            'event_id' => $this->event->id,
            'category_id' => $category->id,
            'name' => 'Paid Team Hackathon',
            'registration_fee' => 250000.00,
            'registration_start' => now()->subDays(2),
            'registration_deadline' => now()->addDays(10),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        $this->freeIndividualComp = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $category->id,
            'name' => 'Free Poster Contest',
            'registration_type' => RegistrationType::INDIVIDUAL,
            'registration_fee' => 0.00,
            'registration_start' => now()->subDays(2),
            'registration_deadline' => now()->addDays(10),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);
    }

    public function test_public_payment_config_returns_safe_fields_only(): void
    {
        $response = $this->getJson('/api/v1/public/payment-config');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment_enabled', true)
            ->assertJsonPath('data.client_key', 'SB-Mid-client-TEST')
            ->assertJsonPath('data.is_production', false)
            ->assertJsonPath('data.snap_script_url', 'https://app.sandbox.midtrans.com/snap/snap.js')
            ->assertJsonMissingPath('data.server_key')
            ->assertJsonMissingPath('data.signature_secret');
    }

    public function test_rejects_payment_creation_when_payment_module_is_disabled(): void
    {
        EventSetting::where('event_id', $this->event->id)
            ->where('setting_key', 'payment_enabled')
            ->update(['setting_value' => 'false']);

        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        $response = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments");

        $response->assertStatus(409)
            ->assertJsonPath('success', false);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_participant_can_create_snap_payment_with_server_determined_amount_and_unique_order_id(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-150k',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-150k',
            ], 201),
        ]);

        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        // Attempt price tampering in request body
        $response = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments", [
                'amount' => 1,
                'status' => 'paid',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.amount', 150000)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.snap_token', 'snap-token-150k');

        $orderId = $response->json('data.order_id');
        $this->assertNotEmpty($orderId);
        $this->assertStringStartsWith("ITC-PAY-{$reg->id}-", $orderId);

        $this->assertDatabaseHas('payments', [
            'registration_id' => $reg->id,
            'user_id' => $this->participant->id,
            'order_id' => $orderId,
            'amount' => 150000.00,
            'status' => 'pending',
            'gateway' => 'midtrans',
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'payment.create',
            'entity_type' => 'Payment',
            'user_id' => $this->participant->id,
        ]);
    }

    public function test_reuses_active_pending_snap_transaction_instead_of_creating_duplicate(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-reusable',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-reusable',
            ], 201),
        ]);

        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        $first = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments");
        $first->assertStatus(201);

        $second = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments");
        $second->assertStatus(200)
            ->assertJsonPath('data.order_id', $first->json('data.order_id'))
            ->assertJsonPath('data.snap_token', 'snap-token-reusable');

        $this->assertDatabaseCount('payments', 1);
        Http::assertSentCount(1);
    }

    public function test_expiry_is_capped_by_registration_deadline_when_sooner_than_24_hours(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-short-expiry',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-short-expiry',
            ], 201),
        ]);

        $deadline = now()->addHours(4);
        $this->paidIndividualComp->update(['registration_deadline' => $deadline]);

        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        $response = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments");

        $response->assertStatus(201);
        $payment = Payment::first();

        $this->assertNotNull($payment->expired_at);
        $this->assertTrue($payment->expired_at->lessThanOrEqualTo($deadline->addSecond()));
    }

    public function test_free_competition_rejects_payment_creation(): void
    {
        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->freeIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        $response = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments");

        $response->assertStatus(422);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_draft_and_approved_registrations_cannot_create_payment(): void
    {
        $draftReg = Registration::factory()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::DRAFT,
        ]);

        $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$draftReg->id}/payments")
            ->assertStatus(409);

        $approvedReg = Registration::factory()->approved()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$approvedReg->id}/payments")
            ->assertStatus(409);
    }

    public function test_cannot_create_new_payment_when_registration_is_already_paid(): void
    {
        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        Payment::factory()->paid()->create([
            'registration_id' => $reg->id,
            'user_id' => $this->participant->id,
            'amount' => 150000,
        ]);

        $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments")
            ->assertStatus(409);
    }

    public function test_only_team_leader_can_initiate_payment_while_team_members_can_view(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-team',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-team',
            ], 201),
        ]);

        $team = Team::create([
            'name' => 'Alpha Coders',
            'team_code' => 'TEAM-ALPHA1',
            'leader_id' => $this->participant->id,
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->participant->id,
            'member_role' => TeamMemberRole::LEADER,
            'joined_at' => now(),
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->teamMember->id,
            'member_role' => TeamMemberRole::MEMBER,
            'joined_at' => now(),
        ]);

        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidTeamComp->id,
            'participant_id' => null,
            'team_id' => $team->id,
        ]);

        // Non-leader member cannot create payment
        $this->actingAs($this->teamMember)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments")
            ->assertStatus(403);

        // Team leader can create payment
        $createRes = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments");
        $createRes->assertStatus(201)->assertJsonPath('data.amount', 250000);

        $paymentId = $createRes->json('data.id');

        // Team member can view payment list & detail (without receiving checkout snap_token)
        $this->actingAs($this->teamMember)
            ->getJson("/api/v1/participant/registrations/{$reg->id}/payments")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $memberView = $this->actingAs($this->teamMember)
            ->getJson("/api/v1/participant/payments/{$paymentId}");
        $memberView->assertOk()
            ->assertJsonPath('data.id', $paymentId)
            ->assertJsonPath('data.registration.team.leader_id', $this->participant->id)
            ->assertJsonPath('data.registration.competition.event_id', $this->event->id)
            ->assertJsonMissingPath('data.snap_token');

        // Dashboard eager loads latest_payment on recent_registrations
        $this->actingAs($this->participant)
            ->getJson('/api/v1/participant/dashboard')
            ->assertOk()
            ->assertJsonPath('data.recent_registrations.0.latest_payment.id', $paymentId);

        // Stranger cannot access
        $this->actingAs($this->stranger)
            ->getJson("/api/v1/participant/payments/{$paymentId}")
            ->assertStatus(403);

        $this->actingAs($this->stranger)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments")
            ->assertStatus(403);
    }

    public function test_admin_cannot_approve_paid_registration_until_payment_is_paid(): void
    {
        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        // Attempt approval without paid payment -> rejected (422)
        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/registrations/{$reg->id}/status", [
                'status' => 'approved',
                'note' => 'Dokumen oke',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payment']);

        $this->assertDatabaseHas('registrations', [
            'id' => $reg->id,
            'status' => 'submitted',
        ]);

        // Create pending payment -> still rejected
        $payment = Payment::factory()->create([
            'registration_id' => $reg->id,
            'user_id' => $this->participant->id,
            'amount' => 150000,
            'status' => PaymentStatus::PENDING,
        ]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/registrations/{$reg->id}/status", [
                'status' => 'approved',
            ])
            ->assertStatus(422);

        // Once payment is paid -> admin can approve
        $payment->update([
            'status' => PaymentStatus::PAID,
            'paid_at' => now(),
        ]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/registrations/{$reg->id}/status", [
                'status' => 'approved',
                'note' => 'Dokumen & pembayaran valid',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_admin_cannot_approve_paid_registration_when_payment_module_is_disabled_and_unpaid(): void
    {
        EventSetting::where('event_id', $this->event->id)
            ->where('setting_key', 'payment_enabled')
            ->update(['setting_value' => 'false']);

        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        // PD-02 Strict + PD-07: disabling payment_enabled does NOT waive payment requirement
        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/registrations/{$reg->id}/status", [
                'status' => 'approved',
                'note' => 'Coba approve saat modul payment mati',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payment']);

        $this->assertDatabaseHas('registrations', [
            'id' => $reg->id,
            'status' => 'submitted',
        ]);

        // Paid/verified historical settlement still allows approval even if toggle is off
        Payment::factory()->paid()->create([
            'registration_id' => $reg->id,
            'user_id' => $this->participant->id,
            'amount' => 150000,
            'status' => PaymentStatus::VERIFIED,
        ]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/registrations/{$reg->id}/status", [
                'status' => 'approved',
                'note' => 'Pembayaran terverifikasi',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_admin_can_approve_free_competition_registration_without_payment(): void
    {
        $regWithPaymentEnabled = Registration::factory()->submitted()->create([
            'competition_id' => $this->freeIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/registrations/{$regWithPaymentEnabled->id}/status", [
                'status' => 'approved',
                'note' => 'Lomba gratis disetujui saat payment enabled',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        EventSetting::where('event_id', $this->event->id)
            ->where('setting_key', 'payment_enabled')
            ->update(['setting_value' => 'false']);

        $regWithPaymentDisabled = Registration::factory()->submitted()->create([
            'competition_id' => $this->freeIndividualComp->id,
            'participant_id' => $this->teamMember->id,
        ]);

        $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/registrations/{$regWithPaymentDisabled->id}/status", [
                'status' => 'approved',
                'note' => 'Lomba gratis disetujui saat payment disabled',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_unauthenticated_and_admin_access_on_participant_payment_endpoints_are_blocked(): void
    {
        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        $this->getJson('/api/v1/participant/payments')->assertStatus(401);
        $this->postJson("/api/v1/participant/registrations/{$reg->id}/payments")->assertStatus(401);

        $this->actingAs($this->admin)
            ->getJson('/api/v1/participant/payments')
            ->assertStatus(403);
    }

    public function test_expired_pending_payment_is_marked_expired_and_issues_new_order_id(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-new-after-expiry',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-new-after-expiry',
            ], 201),
        ]);

        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
        ]);

        $stalePending = Payment::factory()->create([
            'registration_id' => $reg->id,
            'user_id' => $this->participant->id,
            'order_id' => 'ITC-PAY-STALE-001',
            'amount' => 150000,
            'status' => PaymentStatus::PENDING,
            'expired_at' => now()->subMinutes(5),
        ]);

        $response = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments");

        $response->assertStatus(201)
            ->assertJsonPath('data.snap_token', 'snap-token-new-after-expiry');

        $this->assertNotSame('ITC-PAY-STALE-001', $response->json('data.order_id'));
        $this->assertDatabaseHas('payments', [
            'id' => $stalePending->id,
            'status' => 'expired',
        ]);
        $this->assertDatabaseCount('payments', 2);
    }

    public function test_fee_change_preserves_old_registrant_pending_payment_and_mismatched_snapshot_replaces_stale_order(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'snap-token-updated-fee',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-updated-fee',
            ], 201),
        ]);

        $reg = Registration::factory()->submitted()->create([
            'competition_id' => $this->paidIndividualComp->id,
            'participant_id' => $this->participant->id,
            'registration_fee_snapshot' => '150000.00',
        ]);

        $oldPending = Payment::factory()->create([
            'registration_id' => $reg->id,
            'user_id' => $this->participant->id,
            'order_id' => 'ITC-PAY-OLD-FEE-001',
            'amount' => 150000,
            'status' => PaymentStatus::PENDING,
            'expired_at' => now()->addHours(12),
        ]);

        // Competition fee updated by admin -> old registrant's locked snapshot & pending order MUST remain at 150000
        $this->paidIndividualComp->update(['registration_fee' => 200000.00]);

        $reuseResponse = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments");

        $reuseResponse->assertStatus(200)
            ->assertJsonPath('data.id', $oldPending->id)
            ->assertJsonPath('data.amount', 150000);

        // If the registration's own snapshot differs from an older pending amount, the stale order is replaced cleanly
        $reg->update(['registration_fee_snapshot' => '200000.00']);

        $replaceResponse = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$reg->id}/payments");

        $replaceResponse->assertStatus(201)
            ->assertJsonPath('data.amount', 200000)
            ->assertJsonPath('data.snap_token', 'snap-token-updated-fee');

        $this->assertDatabaseHas('payments', [
            'id' => $oldPending->id,
            'status' => 'cancelled',
        ]);
    }
}
