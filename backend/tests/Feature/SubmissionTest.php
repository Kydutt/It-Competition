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

class SubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $participant1;

    protected User $participant2;

    protected Competition $paidComp;

    protected Competition $freeComp;

    protected Registration $paidReg;

    protected Registration $freeReg;

    protected Registration $unapprovedReg;

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
            'name' => 'Web Dev Battle',
            'slug' => 'web-dev-battle',
            'competition_type' => CompetitionType::Individual,
            'category' => CompetitionCategory::WebDevelopment,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Web Dev Competition',
            'registration_fee' => 50000,
            'min_team_member' => 1,
            'max_team_member' => 1,
            'submission_start' => now()->subDays(2),
            'submission_deadline' => now()->addDays(5),
            'status' => CompetitionStatus::RegistrationOpen,
            'is_published' => true,
        ]);

        $this->freeComp = Competition::create([
            'name' => 'Free Poster Challenge',
            'slug' => 'free-poster-challenge',
            'competition_type' => CompetitionType::Individual,
            'category' => CompetitionCategory::Poster,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Free Poster Competition',
            'registration_fee' => 0,
            'min_team_member' => 1,
            'max_team_member' => 1,
            'submission_start' => now()->subDays(2),
            'submission_deadline' => now()->addDays(5),
            'status' => CompetitionStatus::RegistrationOpen,
            'is_published' => true,
        ]);

        $this->paidReg = Registration::create([
            'registration_number' => 'ITC-2026-SUB01',
            'competition_id' => $this->paidComp->id,
            'user_id' => $this->participant1->id,
            'status' => RegistrationStatus::Approved,
        ]);

        $this->freeReg = Registration::create([
            'registration_number' => 'ITC-2026-SUB02',
            'competition_id' => $this->freeComp->id,
            'user_id' => $this->participant1->id,
            'status' => RegistrationStatus::Approved,
        ]);

        $this->unapprovedReg = Registration::create([
            'registration_number' => 'ITC-2026-SUB03',
            'competition_id' => $this->freeComp->id,
            'user_id' => $this->participant2->id,
            'status' => RegistrationStatus::Draft,
        ]);
    }

    public function test_unapproved_registration_cannot_create_submission(): void
    {
        $response = $this->actingAs($this->participant2)
            ->postJson('/api/v1/participant/submissions', [
                'registration_id' => $this->unapprovedReg->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['registration_id']);
    }

    public function test_paid_competition_without_approved_payment_cannot_create_submission(): void
    {
        // Payment is still pending
        Payment::create([
            'registration_id' => $this->paidReg->id,
            'user_id' => $this->participant1->id,
            'amount' => 50000,
            'status' => PaymentStatus::Pending,
        ]);

        $response = $this->actingAs($this->participant1)
            ->postJson('/api/v1/participant/submissions', [
                'registration_id' => $this->paidReg->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['registration_id']);
    }

    public function test_free_competition_can_directly_create_submission(): void
    {
        $response = $this->actingAs($this->participant1)
            ->postJson('/api/v1/participant/submissions', [
                'registration_id' => $this->freeReg->id,
                'title' => 'Karya Poster Literasi Bebas',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Karya Poster Literasi Bebas')
            ->assertJsonPath('data.status', 'draft');

        $this->assertDatabaseHas('submissions', [
            'registration_id' => $this->freeReg->id,
            'status' => 'draft',
        ]);
    }

    public function test_submission_window_enforcement(): void
    {
        // Set approved payment
        Payment::create([
            'registration_id' => $this->paidReg->id,
            'user_id' => $this->participant1->id,
            'amount' => 50000,
            'status' => PaymentStatus::Approved,
        ]);

        // 1. Before submission start
        $this->paidComp->update(['submission_start' => now()->addDays(2)]);
        $resBefore = $this->actingAs($this->participant1)
            ->postJson('/api/v1/participant/submissions', ['registration_id' => $this->paidReg->id]);
        $resBefore->assertStatus(422);

        // 2. After deadline
        $this->paidComp->update([
            'submission_start' => now()->subDays(5),
            'submission_deadline' => now()->subDay(),
        ]);
        $resAfter = $this->actingAs($this->participant1)
            ->postJson('/api/v1/participant/submissions', ['registration_id' => $this->paidReg->id]);
        $resAfter->assertStatus(422);
    }

    public function test_submission_file_upload_validation(): void
    {
        $submission = Submission::create([
            'registration_id' => $this->freeReg->id,
            'competition_id' => $this->freeComp->id,
            'title' => 'Test Submission',
            'status' => SubmissionStatus::Draft,
        ]);

        // 1. Executable file rejected
        $phpFile = UploadedFile::fake()->create('exploit.php', 10, 'text/x-php');
        $res1 = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/submissions/{$submission->id}/files", [
                'file' => $phpFile,
            ]);
        $res1->assertStatus(422);

        // 2. Valid PDF file accepted
        $pdfFile = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');
        $res2 = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/submissions/{$submission->id}/files", [
                'file' => $pdfFile,
            ]);
        $res2->assertStatus(201)
            ->assertJsonPath('data.original_name', 'document.pdf');

        $this->assertDatabaseHas('submission_files', [
            'submission_id' => $submission->id,
            'original_name' => 'document.pdf',
        ]);
    }

    public function test_cannot_finalize_submission_without_files(): void
    {
        $submission = Submission::create([
            'registration_id' => $this->freeReg->id,
            'competition_id' => $this->freeComp->id,
            'title' => 'Empty Submission',
            'status' => SubmissionStatus::Draft,
        ]);

        $response = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/submissions/{$submission->id}/submit");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['submission']);
    }

    public function test_submission_finalization_and_resubmission_before_deadline(): void
    {
        $submission = Submission::create([
            'registration_id' => $this->freeReg->id,
            'competition_id' => $this->freeComp->id,
            'title' => 'Complete Work',
            'status' => SubmissionStatus::Draft,
        ]);

        $file = SubmissionFile::create([
            'submission_id' => $submission->id,
            'original_name' => 'work.zip',
            'stored_name' => 'file_123.zip',
            'mime_type' => 'application/zip',
            'size' => 1024,
            'path' => 'submissions/1/1/file_123.zip',
        ]);
        Storage::disk('local')->put($file->path, 'zip-content');

        // Submit work
        $response = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/submissions/{$submission->id}/submit");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'submitted');

        $submission->refresh();
        $this->assertEquals(SubmissionStatus::Submitted, $submission->status);
        $this->assertNotNull($submission->submitted_at);

        // Before deadline, can upload another file / resubmit
        $newFile = UploadedFile::fake()->create('extra.pdf', 200, 'application/pdf');
        $resExtra = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/submissions/{$submission->id}/files", [
                'file' => $newFile,
            ]);
        $resExtra->assertStatus(201);
    }

    public function test_modification_after_deadline_strictly_rejected(): void
    {
        $submission = Submission::create([
            'registration_id' => $this->freeReg->id,
            'competition_id' => $this->freeComp->id,
            'title' => 'Late Work',
            'status' => SubmissionStatus::Draft,
        ]);

        // Competition deadline expired
        $this->freeComp->update(['submission_deadline' => now()->subMinute()]);

        $file = UploadedFile::fake()->create('late.pdf', 100, 'application/pdf');
        $response = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/submissions/{$submission->id}/files", [
                'file' => $file,
            ]);

        $response->assertStatus(422);
    }

    public function test_authorized_submission_file_download(): void
    {
        $submission = Submission::create([
            'registration_id' => $this->freeReg->id,
            'competition_id' => $this->freeComp->id,
            'title' => 'File Download Test',
            'status' => SubmissionStatus::Submitted,
        ]);

        $file = SubmissionFile::create([
            'submission_id' => $submission->id,
            'original_name' => 'final_report.pdf',
            'stored_name' => 'stored_report.pdf',
            'mime_type' => 'application/pdf',
            'size' => 1024,
            'path' => 'submissions/test/stored_report.pdf',
        ]);
        Storage::disk('local')->put($file->path, 'pdf-content');

        // Participant 1 (owner) can download
        $resOwner = $this->actingAs($this->participant1)
            ->get("/api/v1/participant/submissions/{$submission->id}/files/{$file->id}");
        $resOwner->assertStatus(200);

        // Admin can download
        $resAdmin = $this->actingAs($this->admin)
            ->get("/api/v1/admin/submissions/{$submission->id}/files/{$file->id}");
        $resAdmin->assertStatus(200);

        // Participant 2 (stranger) is blocked
        $resStranger = $this->actingAs($this->participant2)
            ->get("/api/v1/participant/submissions/{$submission->id}/files/{$file->id}");
        $resStranger->assertStatus(403);
    }
}
