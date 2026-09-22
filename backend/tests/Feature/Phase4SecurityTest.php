<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\CompetitionTargetLevel;
use App\Enums\CompetitionType;
use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Enums\SubmissionStatus;
use App\Enums\UserRole;
use App\Models\Competition;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\SubmissionFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class Phase4SecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $participantA;

    protected User $participantB;

    protected Competition $paidComp;

    protected Registration $regA;

    protected Registration $regB;

    protected Payment $paymentA;

    protected Payment $paymentB;

    protected Submission $submissionA;

    protected Submission $submissionB;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@security.test',
            'password' => bcrypt('password'),
            'role' => UserRole::Admin,
        ]);

        $this->participantA = User::create([
            'name' => 'Participant A',
            'email' => 'alice@security.test',
            'password' => bcrypt('password'),
            'role' => UserRole::Participant,
            'education_level' => 'university',
            'institution' => 'Univ A',
        ]);

        $this->participantB = User::create([
            'name' => 'Participant B',
            'email' => 'bob@security.test',
            'password' => bcrypt('password'),
            'role' => UserRole::Participant,
            'education_level' => 'university',
            'institution' => 'Univ B',
        ]);

        $this->paidComp = Competition::create([
            'name' => 'Cyber Security Challenge',
            'slug' => 'cyber-security-challenge',
            'competition_type' => CompetitionType::Individual,
            'category' => CompetitionCategory::WebDevelopment,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Security Test Competition',
            'registration_fee' => 75000,
            'min_team_member' => 1,
            'max_team_member' => 1,
            'submission_start' => now()->subDays(2),
            'submission_deadline' => now()->addDays(5),
            'status' => CompetitionStatus::RegistrationOpen,
            'is_published' => true,
        ]);

        $this->regA = Registration::create([
            'registration_number' => 'ITC-2026-SEC01',
            'competition_id' => $this->paidComp->id,
            'user_id' => $this->participantA->id,
            'status' => RegistrationStatus::Approved,
        ]);

        $this->regB = Registration::create([
            'registration_number' => 'ITC-2026-SEC02',
            'competition_id' => $this->paidComp->id,
            'user_id' => $this->participantB->id,
            'status' => RegistrationStatus::Approved,
        ]);

        $this->paymentA = Payment::create([
            'registration_id' => $this->regA->id,
            'user_id' => $this->participantA->id,
            'amount' => 75000,
            'status' => PaymentStatus::Approved,
            'proof_path' => 'payments/secA/proof.jpg',
        ]);
        Storage::disk('local')->put($this->paymentA->proof_path, 'proof-a');

        $this->paymentB = Payment::create([
            'registration_id' => $this->regB->id,
            'user_id' => $this->participantB->id,
            'amount' => 75000,
            'status' => PaymentStatus::Approved,
            'proof_path' => 'payments/secB/proof.jpg',
        ]);
        Storage::disk('local')->put($this->paymentB->proof_path, 'proof-b');

        $this->submissionA = Submission::create([
            'registration_id' => $this->regA->id,
            'competition_id' => $this->paidComp->id,
            'title' => 'Submission Alice',
            'status' => SubmissionStatus::Draft,
        ]);

        $this->submissionB = Submission::create([
            'registration_id' => $this->regB->id,
            'competition_id' => $this->paidComp->id,
            'title' => 'Submission Bob',
            'status' => SubmissionStatus::Draft,
        ]);
    }

    /**
     * Test: Participant A cannot view or manipulate Participant B's payment.
     */
    public function test_participant_a_cannot_access_participant_b_payment(): void
    {
        // View Participant B's payment
        $response = $this->actingAs($this->participantA)
            ->getJson("/api/v1/participant/payments/{$this->paymentB->id}");
        $response->assertStatus(403);

        // Upload proof to Participant B's payment
        $fakeImg = UploadedFile::fake()->image('tamper.png');
        $uploadResponse = $this->actingAs($this->participantA)
            ->postJson("/api/v1/participant/payments/{$this->paymentB->id}/proof", [
                'proof' => $fakeImg,
            ]);
        $uploadResponse->assertStatus(403);

        // Submit Participant B's payment
        $submitResponse = $this->actingAs($this->participantA)
            ->postJson("/api/v1/participant/payments/{$this->paymentB->id}/submit");
        $submitResponse->assertStatus(403);

        // Download proof of Participant B
        $downloadResponse = $this->actingAs($this->participantA)
            ->get("/api/v1/participant/payments/{$this->paymentB->id}/proof");
        $downloadResponse->assertStatus(403);
    }

    /**
     * Test: Participant A cannot view or manipulate Participant B's submission.
     */
    public function test_participant_a_cannot_access_participant_b_submission(): void
    {
        // View Participant B's submission
        $response = $this->actingAs($this->participantA)
            ->getJson("/api/v1/participant/submissions/{$this->submissionB->id}");
        $response->assertStatus(403);

        // Upload file to Participant B's submission
        $fakeFile = UploadedFile::fake()->create('tamper.pdf', 100, 'application/pdf');
        $uploadResponse = $this->actingAs($this->participantA)
            ->postJson("/api/v1/participant/submissions/{$this->submissionB->id}/files", [
                'file' => $fakeFile,
            ]);
        $uploadResponse->assertStatus(403);

        // Submit Participant B's submission
        $submitResponse = $this->actingAs($this->participantA)
            ->postJson("/api/v1/participant/submissions/{$this->submissionB->id}/submit");
        $submitResponse->assertStatus(403);
    }

    /**
     * Test: Participant cannot access Admin payment endpoints.
     */
    public function test_participant_cannot_access_admin_payment_endpoints(): void
    {
        // GET /api/v1/admin/payments
        $response = $this->actingAs($this->participantA)
            ->getJson('/api/v1/admin/payments');
        $response->assertStatus(403);

        // GET /api/v1/admin/payments/{id}
        $showResponse = $this->actingAs($this->participantA)
            ->getJson("/api/v1/admin/payments/{$this->paymentA->id}");
        $showResponse->assertStatus(403);

        // PATCH /api/v1/admin/payments/{id}/approve
        $approveResponse = $this->actingAs($this->participantA)
            ->patchJson("/api/v1/admin/payments/{$this->paymentA->id}/approve");
        $approveResponse->assertStatus(403);

        // PATCH /api/v1/admin/payments/{id}/reject
        $rejectResponse = $this->actingAs($this->participantA)
            ->patchJson("/api/v1/admin/payments/{$this->paymentA->id}/reject", [
                'reason' => 'Unauthorized rejection',
            ]);
        $rejectResponse->assertStatus(403);
    }

    /**
     * Test: Participant cannot access Admin submission endpoints.
     */
    public function test_participant_cannot_access_admin_submission_endpoints(): void
    {
        // GET /api/v1/admin/submissions
        $response = $this->actingAs($this->participantA)
            ->getJson('/api/v1/admin/submissions');
        $response->assertStatus(403);

        // GET /api/v1/admin/submissions/{id}
        $showResponse = $this->actingAs($this->participantA)
            ->getJson("/api/v1/admin/submissions/{$this->submissionA->id}");
        $showResponse->assertStatus(403);
    }

    /**
     * Test: Direct ID manipulation across sequential IDs.
     */
    public function test_direct_id_enumeration_and_manipulation_protection(): void
    {
        $nonExistentId = 999999;

        // Participant querying unknown payment ID returns 404/403 securely
        $payResponse = $this->actingAs($this->participantA)
            ->getJson("/api/v1/participant/payments/{$nonExistentId}");
        $this->assertContains($payResponse->status(), [403, 404]);

        // Participant querying unknown submission ID returns 404/403 securely
        $subResponse = $this->actingAs($this->participantA)
            ->getJson("/api/v1/participant/submissions/{$nonExistentId}");
        $this->assertContains($subResponse->status(), [403, 404]);
    }
}
