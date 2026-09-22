<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\CompetitionTargetLevel;
use App\Enums\CompetitionType;
use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Enums\UserRole;
use App\Models\Competition;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $participant1;

    protected User $participant2;

    protected Competition $paidComp;

    protected Competition $freeComp;

    protected Registration $paidReg;

    protected Registration $freeReg;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Admin,
        ]);

        $this->participant1 = User::create([
            'name' => 'Participant 1',
            'email' => 'p1@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Participant,
            'education_level' => 'university',
            'institution' => 'Univ X',
        ]);

        $this->participant2 = User::create([
            'name' => 'Participant 2',
            'email' => 'p2@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Participant,
            'education_level' => 'university',
            'institution' => 'Univ Y',
        ]);

        $this->paidComp = Competition::create([
            'name' => 'Paid Web Dev',
            'slug' => 'paid-web-dev',
            'competition_type' => CompetitionType::Individual,
            'category' => CompetitionCategory::WebDevelopment,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Paid Competition Description',
            'registration_fee' => 75000,
            'min_team_member' => 1,
            'max_team_member' => 1,
            'status' => CompetitionStatus::RegistrationOpen,
            'is_published' => true,
        ]);

        $this->freeComp = Competition::create([
            'name' => 'Free Poster',
            'slug' => 'free-poster',
            'competition_type' => CompetitionType::Individual,
            'category' => CompetitionCategory::Poster,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Free Competition Description',
            'registration_fee' => 0,
            'min_team_member' => 1,
            'max_team_member' => 1,
            'status' => CompetitionStatus::RegistrationOpen,
            'is_published' => true,
        ]);

        $this->paidReg = Registration::create([
            'registration_number' => 'ITC-2026-PAID01',
            'competition_id' => $this->paidComp->id,
            'user_id' => $this->participant1->id,
            'status' => RegistrationStatus::Approved,
        ]);

        $this->freeReg = Registration::create([
            'registration_number' => 'ITC-2026-FREE01',
            'competition_id' => $this->freeComp->id,
            'user_id' => $this->participant1->id,
            'status' => RegistrationStatus::Approved,
        ]);
    }

    public function test_free_competition_bypasses_payment_creation(): void
    {
        $response = $this->actingAs($this->participant1)
            ->postJson('/api/v1/participant/payments', [
                'registration_id' => $this->freeReg->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['registration_id']);

        $this->assertTrue($this->freeReg->isPaymentCleared());
    }

    public function test_paid_competition_creates_payment_with_server_determined_amount(): void
    {
        // Participant attempts to spoof amount to 1000
        $response = $this->actingAs($this->participant1)
            ->postJson('/api/v1/participant/payments', [
                'registration_id' => $this->paidReg->id,
                'amount' => 1000,
                'payment_method' => 'bank_transfer',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.amount', 75000)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('payments', [
            'registration_id' => $this->paidReg->id,
            'amount' => 75000,
            'status' => 'pending',
        ]);
    }

    public function test_participant_cannot_create_or_view_another_participants_payment(): void
    {
        // Participant 2 attempts to create payment for Participant 1's registration
        $response = $this->actingAs($this->participant2)
            ->postJson('/api/v1/participant/payments', [
                'registration_id' => $this->paidReg->id,
            ]);

        $response->assertStatus(422);

        $payment = Payment::create([
            'registration_id' => $this->paidReg->id,
            'user_id' => $this->participant1->id,
            'amount' => 75000,
            'status' => PaymentStatus::Pending,
        ]);

        $viewResponse = $this->actingAs($this->participant2)
            ->getJson("/api/v1/participant/payments/{$payment->id}");

        $viewResponse->assertStatus(403);
    }

    public function test_payment_proof_upload_validation(): void
    {
        $payment = Payment::create([
            'registration_id' => $this->paidReg->id,
            'user_id' => $this->participant1->id,
            'amount' => 75000,
            'status' => PaymentStatus::Pending,
        ]);

        // 1. Invalid executable file rejected
        $fakeExe = UploadedFile::fake()->create('malicious.php', 100, 'application/x-php');
        $response1 = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/payments/{$payment->id}/proof", [
                'proof' => $fakeExe,
            ]);
        $response1->assertStatus(422);

        // 2. Oversized file (> 5MB) rejected
        $fakeLarge = UploadedFile::fake()->create('huge.jpg', 6000, 'image/jpeg');
        $response2 = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/payments/{$payment->id}/proof", [
                'proof' => $fakeLarge,
            ]);
        $response2->assertStatus(422);

        // 3. Valid image accepted
        $fakeImage = UploadedFile::fake()->image('proof.jpg', 800, 600);
        $response3 = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/payments/{$payment->id}/proof", [
                'proof' => $fakeImage,
            ]);
        $response3->assertStatus(200)
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.has_proof', true);

        $payment->refresh();
        $this->assertNotNull($payment->proof_path);
        Storage::disk('local')->assertExists($payment->proof_path);
    }

    public function test_payment_submission_moves_to_under_review(): void
    {
        $payment = Payment::create([
            'registration_id' => $this->paidReg->id,
            'user_id' => $this->participant1->id,
            'amount' => 75000,
            'status' => PaymentStatus::Submitted,
            'proof_path' => 'payments/test/proof.jpg',
        ]);

        Storage::disk('local')->put('payments/test/proof.jpg', 'dummy');

        $response = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/payments/{$payment->id}/submit");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'under_review');

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'under_review',
        ]);
    }

    public function test_admin_can_approve_payment(): void
    {
        $payment = Payment::create([
            'registration_id' => $this->paidReg->id,
            'user_id' => $this->participant1->id,
            'amount' => 75000,
            'status' => PaymentStatus::UnderReview,
            'proof_path' => 'payments/test/proof.jpg',
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/payments/{$payment->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'approved',
            'reviewed_by' => $this->admin->id,
        ]);

        $this->assertTrue($this->paidReg->fresh()->isPaymentCleared());
    }

    public function test_admin_can_reject_payment_with_required_reason(): void
    {
        $payment = Payment::create([
            'registration_id' => $this->paidReg->id,
            'user_id' => $this->participant1->id,
            'amount' => 75000,
            'status' => PaymentStatus::UnderReview,
            'proof_path' => 'payments/test/proof.jpg',
        ]);

        // Rejection without reason fails
        $failResponse = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/payments/{$payment->id}/reject", []);
        $failResponse->assertStatus(422)->assertJsonValidationErrors(['reason']);

        // Rejection with valid reason succeeds
        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/admin/payments/{$payment->id}/reject", [
                'reason' => 'Struk transfer tidak menampilkan tanggal transaksi yang sah.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Struk transfer tidak menampilkan tanggal transaksi yang sah.');

        // Participant can re-upload proof after rejection
        $newProof = UploadedFile::fake()->image('new_proof.png');
        $reuploadResponse = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/payments/{$payment->id}/proof", [
                'proof' => $newProof,
            ]);
        $reuploadResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'submitted');
    }

    public function test_authorized_proof_download(): void
    {
        $payment = Payment::create([
            'registration_id' => $this->paidReg->id,
            'user_id' => $this->participant1->id,
            'amount' => 75000,
            'status' => PaymentStatus::UnderReview,
            'proof_path' => 'payments/test/proof.jpg',
        ]);
        Storage::disk('local')->put('payments/test/proof.jpg', 'sample-image-content');

        // Participant 1 (owner) can download
        $responseOwner = $this->actingAs($this->participant1)
            ->get("/api/v1/participant/payments/{$payment->id}/proof");
        $responseOwner->assertStatus(200);

        // Admin can download
        $responseAdmin = $this->actingAs($this->admin)
            ->get("/api/v1/admin/payments/{$payment->id}/proof");
        $responseAdmin->assertStatus(200);

        // Participant 2 (stranger) is blocked with 403
        $responseStranger = $this->actingAs($this->participant2)
            ->get("/api/v1/participant/payments/{$payment->id}/proof");
        $responseStranger->assertStatus(403);
    }
}
