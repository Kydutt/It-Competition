<?php

namespace Tests\Feature;

use App\Enums\CompetitionStatus;
use App\Enums\RegistrationStatus;
use App\Enums\Role;
use App\Enums\SubmissionStatus;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\Notification;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\SubmissionRevision;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubmissionReviewWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $participant;
    protected Registration $registration;
    protected Competition $competition;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => Role::ADMIN,
            'is_active' => true,
        ]);

        $this->participant = User::factory()->create([
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();
        $this->competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
            'status' => CompetitionStatus::PUBLISHED,
        ]);

        $this->registration = Registration::factory()->create([
            'competition_id' => $this->competition->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::APPROVED,
        ]);
    }

    private function createSubmission(SubmissionStatus $status = SubmissionStatus::SUBMITTED): Submission
    {
        return Submission::create([
            'registration_id' => $this->registration->id,
            'title' => 'Sistem Analitik Cerdas',
            'description' => 'Platform monitoring dan evaluasi berbasis AI.',
            'repository_url' => 'https://github.com/itcomp/smart-analytics',
            'external_url' => 'https://smart-analytics.itcomp.test',
            'status' => $status,
            'submitted_at' => now(),
        ]);
    }

    // 1. Submission submitted dapat masuk ke under_review
    public function test_submitted_submission_can_transition_to_under_review(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::SUBMITTED);

        $response = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::UNDER_REVIEW->value,
            'notes' => 'Sedang diperiksa oleh dewan penilai administratif.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', SubmissionStatus::UNDER_REVIEW->value);

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => SubmissionStatus::UNDER_REVIEW->value,
            'review_note' => 'Sedang diperiksa oleh dewan penilai administratif.',
            'reviewed_by' => $this->admin->id,
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'submission.review',
            'entity_type' => 'Submission',
            'entity_id' => $submission->id,
            'user_id' => $this->admin->id,
        ]);
    }

    // 2. Submission under_review dapat approved (accepted)
    public function test_under_review_submission_can_be_approved(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::UNDER_REVIEW);

        $response = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::ACCEPTED->value,
            'notes' => 'Karya memenuhi seluruh kriteria kompetisi.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', SubmissionStatus::ACCEPTED->value);

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => SubmissionStatus::ACCEPTED->value,
            'review_note' => 'Karya memenuhi seluruh kriteria kompetisi.',
            'reviewed_by' => $this->admin->id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->participant->id,
            'type' => 'submission',
        ]);
    }

    // 3. Submission under_review dapat revision_required
    public function test_under_review_submission_can_be_requested_for_revision(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::UNDER_REVIEW);

        $response = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::REVISION_REQUIRED->value,
            'notes' => 'Harap sertakan video demo berdurasi 3 menit pada repositori.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', SubmissionStatus::REVISION_REQUIRED->value);

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => SubmissionStatus::REVISION_REQUIRED->value,
            'review_note' => 'Harap sertakan video demo berdurasi 3 menit pada repositori.',
            'reviewed_by' => $this->admin->id,
        ]);
    }

    // 4. Submission under_review dapat rejected
    public function test_under_review_submission_can_be_rejected(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::UNDER_REVIEW);

        $response = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::REJECTED->value,
            'notes' => 'Repositori kode tidak dapat diakses dan tidak sesuai ketentuan orisinalitas.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', SubmissionStatus::REVISION_REQUIRED ? SubmissionStatus::REJECTED->value : 'rejected');

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => SubmissionStatus::REJECTED->value,
            'review_note' => 'Repositori kode tidak dapat diakses dan tidak sesuai ketentuan orisinalitas.',
            'reviewed_by' => $this->admin->id,
        ]);
    }

    // 5. Revision_required tidak dapat ditinjau ulang sebelum peserta mengirimkan revisi
    public function test_revision_required_submission_cannot_be_reviewed_before_participant_submits_revision(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::REVISION_REQUIRED);

        // Attempting to reject directly from revision_required
        $rejectResponse = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::REJECTED->value,
            'notes' => 'Tolak sepihak sebelum revisi dikirim.',
        ]);

        $rejectResponse->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        $errorMsg = $rejectResponse->json('errors.status.0');
        $this->assertStringContainsString('tidak diizinkan', $errorMsg);
        $this->assertStringContainsString('perbaikan oleh peserta', $errorMsg);

        // Attempting to approve directly from revision_required
        $approveResponse = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::ACCEPTED->value,
            'notes' => 'Langsung setujui padahal belum ada revisi.',
        ]);

        $approveResponse->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        // State remains revision_required
        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => SubmissionStatus::REVISION_REQUIRED->value,
        ]);
    }

    // 6. Submission yang sudah dikirim ulang dapat masuk ke proses review kembali
    public function test_submission_resubmitted_by_participant_can_enter_review_again(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::REVISION_REQUIRED);

        // Participant submits revision
        $revisionResponse = $this->actingAs($this->participant)->postJson("/api/v1/participant/submissions/{$submission->id}/revisions", [
            'external_url' => 'https://smart-analytics-revised.itcomp.test',
            'revision_note' => 'Tautan video demo telah ditambahkan ke berkas README repositori.',
        ]);

        $revisionResponse->assertStatus(200)
            ->assertJsonPath('data.status', SubmissionStatus::SUBMITTED->value);

        // Now admin reviews to under_review
        $reviewResponse = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::UNDER_REVIEW->value,
            'notes' => 'Revisi peserta telah diterima dan sedang diperiksa ulang.',
        ]);

        $reviewResponse->assertStatus(200)
            ->assertJsonPath('data.status', SubmissionStatus::UNDER_REVIEW->value);
    }

    // 7. Submission hasil revisi dapat approved
    public function test_revised_submission_can_be_approved(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::REVISION_REQUIRED);

        // Participant submits revision
        $this->actingAs($this->participant)->postJson("/api/v1/participant/submissions/{$submission->id}/revisions", [
            'revision_note' => 'Revisi perbaikan pertama.',
        ]);

        // Admin approves the resubmitted work
        $response = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::ACCEPTED->value,
            'notes' => 'Revisi lengkap dan karya resmi disetujui.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', SubmissionStatus::ACCEPTED->value);
    }

    // 8. Submission hasil revisi dapat kembali revision_required
    public function test_revised_submission_can_be_requested_for_revision_again(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::REVISION_REQUIRED);

        // Participant submits revision
        $this->actingAs($this->participant)->postJson("/api/v1/participant/submissions/{$submission->id}/revisions", [
            'revision_note' => 'Revisi pertama peserta.',
        ]);

        // Admin requests a second revision
        $response = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::REVISION_REQUIRED->value,
            'notes' => 'Tautan demo masih 404, harap pastikan server berjalan.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', SubmissionStatus::REVISION_REQUIRED->value);
    }

    // 9. Submission hasil revisi dapat rejected
    public function test_revised_submission_can_be_rejected(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::REVISION_REQUIRED);

        // Participant submits revision
        $this->actingAs($this->participant)->postJson("/api/v1/participant/submissions/{$submission->id}/revisions", [
            'revision_note' => 'Mencoba revisi.',
        ]);

        // Admin rejects the resubmitted work
        $response = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::REJECTED->value,
            'notes' => 'Revisi tetap tidak memenuhi batas minimal yang ditentukan pedoman kompetisi.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', SubmissionStatus::REJECTED->value);
    }

    // 10. Catatan wajib ketika revision_required (kosong atau hanya spasi ditolak)
    public function test_notes_are_strictly_required_when_requesting_revision(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::UNDER_REVIEW);

        // Empty notes
        $res1 = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::REVISION_REQUIRED->value,
            'notes' => '',
        ]);
        $res1->assertStatus(422)->assertJsonValidationErrors(['notes']);

        // Whitespace only
        $res2 = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::REVISION_REQUIRED->value,
            'notes' => '   ',
        ]);
        $res2->assertStatus(422)->assertJsonValidationErrors(['notes']);
    }

    // 11. Catatan wajib ketika rejected (kosong atau hanya spasi ditolak)
    public function test_notes_are_strictly_required_when_rejecting_submission(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::UNDER_REVIEW);

        // Empty notes
        $res1 = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::REJECTED->value,
            'notes' => '',
        ]);
        $res1->assertStatus(422)->assertJsonValidationErrors(['notes']);

        // Whitespace only
        $res2 = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::REJECTED->value,
            'notes' => "  \t \n  ",
        ]);
        $res2->assertStatus(422)->assertJsonValidationErrors(['notes']);
    }

    // 12. Participant tidak dapat melakukan review
    public function test_participant_cannot_review_submission(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::SUBMITTED);

        $response = $this->actingAs($this->participant)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::ACCEPTED->value,
            'notes' => 'Self-approval attempt.',
        ]);

        $response->assertStatus(403);
    }

    // 13. Riwayat revisi tetap tersimpan di tabel submission_revisions
    public function test_revision_history_is_preserved_accurately(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::REVISION_REQUIRED);

        // Participant submits revision
        $this->actingAs($this->participant)->postJson("/api/v1/participant/submissions/{$submission->id}/revisions", [
            'external_url' => 'https://rev1.itcomp.test',
            'revision_note' => 'Catatan revisi pertama.',
        ]);

        $this->assertDatabaseHas('submission_revisions', [
            'submission_id' => $submission->id,
            'revision_note' => 'Catatan revisi pertama.',
            'external_url' => 'https://smart-analytics.itcomp.test', // previous URL saved
        ]);

        $this->assertEquals(1, $submission->revisions()->count());
    }

    // 14. Activity Log tercatat ketika status berubah
    public function test_activity_log_is_recorded_on_review(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::SUBMITTED);

        $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::ACCEPTED->value,
            'notes' => 'Disetujui langsung.',
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'submission.review',
            'entity_type' => 'Submission',
            'entity_id' => $submission->id,
            'user_id' => $this->admin->id,
        ]);
    }
}
