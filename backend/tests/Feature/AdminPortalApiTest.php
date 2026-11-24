<?php

namespace Tests\Feature;

use App\Enums\AnnouncementAudience;
use App\Enums\AnnouncementStatus;
use App\Enums\CompetitionStatus;
use App\Enums\DocumentVerificationStatus;
use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Enums\SubmissionStatus;
use App\Models\ActivityLog;
use App\Models\Announcement;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\Faq;
use App\Models\Notification;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminPortalApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $participant;

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
    }

    public function test_unauthenticated_user_cannot_access_admin_portal(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard');
        $response->assertStatus(401);
    }

    public function test_participant_is_forbidden_from_admin_portal(): void
    {
        $response = $this->actingAs($this->participant)->getJson('/api/v1/admin/dashboard');
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Akses ditolak. Endpoint ini khusus untuk administrator.',
            ]);
    }

    public function test_deactivated_admin_is_forbidden_from_admin_portal(): void
    {
        $inactiveAdmin = User::factory()->create([
            'role' => Role::ADMIN,
            'is_active' => false,
        ]);

        $response = $this->actingAs($inactiveAdmin)->getJson('/api/v1/admin/dashboard');
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Akun administrator Anda dinonaktifkan.',
            ]);
    }

    public function test_active_admin_can_access_dashboard_metrics(): void
    {
        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();
        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
        ]);

        Registration::factory()->create([
            'competition_id' => $competition->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/dashboard');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'overview' => [
                        'total_participants',
                        'total_teams',
                        'total_competitions',
                        'total_events',
                        'total_registrations',
                    ],
                    'registrations_by_status',
                    'submissions_by_status',
                    'recent_activity_logs',
                ],
            ]);
    }

    public function test_admin_can_crud_events(): void
    {
        // 1. Create
        $payload = [
            'name' => 'IT Fest 2026',
            'description' => 'Kompetisi IT tahunan.',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-05',
            'status' => EventStatus::PUBLISHED->value,
        ];

        $createResponse = $this->actingAs($this->admin)->postJson('/api/v1/admin/events', $payload);
        $createResponse->assertStatus(201)
            ->assertJsonPath('data.name', 'IT Fest 2026');

        $eventId = $createResponse->json('data.id');

        // 2. Read
        $showResponse = $this->actingAs($this->admin)->getJson("/api/v1/admin/events/{$eventId}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.id', $eventId);

        // 3. Update
        $updateResponse = $this->actingAs($this->admin)->putJson("/api/v1/admin/events/{$eventId}", [
            'name' => 'IT Fest 2026 Updated',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-06',
        ]);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'IT Fest 2026 Updated');

        // 4. Delete
        $deleteResponse = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/events/{$eventId}");
        $deleteResponse->assertStatus(200);

        $this->assertDatabaseMissing('events', ['id' => $eventId]);
    }

    public function test_admin_cannot_delete_event_with_active_registrations(): void
    {
        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();
        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
        ]);

        Registration::factory()->create([
            'competition_id' => $competition->id,
            'participant_id' => $this->participant->id,
        ]);

        $response = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/events/{$event->id}");
        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Event tidak dapat dihapus karena memiliki kompetisi dengan pendaftaran aktif.',
            ]);
    }

    public function test_admin_can_crud_categories(): void
    {
        $createResponse = $this->actingAs($this->admin)->postJson('/api/v1/admin/categories', [
            'name' => 'Software Development',
            'description' => 'Kategori lomba rekayasa perangkat lunak.',
        ]);
        $createResponse->assertStatus(201)
            ->assertJsonPath('data.name', 'Software Development');

        $catId = $createResponse->json('data.id');

        $updateResponse = $this->actingAs($this->admin)->putJson("/api/v1/admin/categories/{$catId}", [
            'name' => 'Software & Web Development',
        ]);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Software & Web Development');

        $deleteResponse = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/categories/{$catId}");
        $deleteResponse->assertStatus(200);
    }

    public function test_admin_can_create_and_update_competition(): void
    {
        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();

        $createResponse = $this->actingAs($this->admin)->postJson('/api/v1/admin/competitions', [
            'event_id' => $event->id,
            'category_id' => $category->id,
            'name' => 'Web Design Competition',
            'description' => 'Desain website inovatif.',
            'registration_type' => RegistrationType::INDIVIDUAL->value,
            'registration_start' => now()->toDateString(),
            'registration_deadline' => now()->addDays(20)->toDateString(),
            'status' => CompetitionStatus::PUBLISHED->value,
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('data.name', 'Web Design Competition');

        $compId = $createResponse->json('data.id');

        $updateResponse = $this->actingAs($this->admin)->putJson("/api/v1/admin/competitions/{$compId}", [
            'name' => 'Web Design Competition 2026',
            'registration_type' => RegistrationType::INDIVIDUAL->value,
            'description' => 'Deskripsi diperbarui.',
            'registration_start' => now()->toDateString(),
            'registration_deadline' => now()->addDays(20)->toDateString(),
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.name', 'Web Design Competition 2026');
    }

    public function test_admin_cannot_change_competition_format_if_registrations_exist(): void
    {
        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();
        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
            'registration_type' => RegistrationType::INDIVIDUAL,
        ]);

        Registration::factory()->create([
            'competition_id' => $competition->id,
            'participant_id' => $this->participant->id,
        ]);

        $response = $this->actingAs($this->admin)->putJson("/api/v1/admin/competitions/{$competition->id}", [
            'registration_type' => RegistrationType::TEAM->value,
            'description' => $competition->description,
            'registration_start' => $competition->registration_start->toDateString(),
            'registration_deadline' => $competition->registration_deadline->toDateString(),
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Format pendaftaran (individu/tim) tidak dapat diubah karena sudah memiliki pendaftaran terdaftar.',
            ]);
    }

    public function test_admin_can_review_registration_status_transitions(): void
    {
        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();
        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
        ]);

        $registration = Registration::factory()->create([
            'competition_id' => $competition->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        // 1. Transition: submitted -> under_review
        $res1 = $this->actingAs($this->admin)->patchJson("/api/v1/admin/registrations/{$registration->id}/status", [
            'status' => RegistrationStatus::UNDER_REVIEW->value,
            'note' => 'Sedang dalam peninjauan dokumen',
        ]);
        $res1->assertStatus(200)
            ->assertJsonPath('data.status', RegistrationStatus::UNDER_REVIEW->value);

        // 2. Transition: under_review -> revision_required requires a note
        $res2Fail = $this->actingAs($this->admin)->patchJson("/api/v1/admin/registrations/{$registration->id}/status", [
            'status' => RegistrationStatus::REVISION_REQUIRED->value,
            'note' => '',
        ]);
        $res2Fail->assertStatus(422);

        // 3. Transition: under_review -> approved
        $res3 = $this->actingAs($this->admin)->patchJson("/api/v1/admin/registrations/{$registration->id}/status", [
            'status' => RegistrationStatus::APPROVED->value,
            'note' => 'Dokumen lengkap dan terverifikasi.',
        ]);
        $res3->assertStatus(200)
            ->assertJsonPath('data.status', RegistrationStatus::APPROVED->value);

        // Verify participant received notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->participant->id,
            'type' => 'registration',
        ]);

        // Verify activity log recorded
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'registration.status_update',
            'entity_type' => 'Registration',
            'entity_id' => $registration->id,
        ]);
    }

    public function test_admin_can_verify_individual_document(): void
    {
        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();
        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
        ]);

        $registration = Registration::factory()->create([
            'competition_id' => $competition->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        $document = RegistrationDocument::create([
            'registration_id' => $registration->id,
            'document_type' => 'student_card',
            'file_path' => 'documents/ktm.pdf',
            'original_filename' => 'ktm.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 102400,
            'verification_status' => DocumentVerificationStatus::PENDING,
        ]);

        $response = $this->actingAs($this->admin)->patchJson("/api/v1/admin/documents/{$document->id}/verify", [
            'status' => DocumentVerificationStatus::VERIFIED->value,
            'note' => 'Kartu tanda mahasiswa sah.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.verification_status', DocumentVerificationStatus::VERIFIED->value);

        $this->assertDatabaseHas('registration_documents', [
            'id' => $document->id,
            'verification_status' => DocumentVerificationStatus::VERIFIED->value,
            'verified_by' => $this->admin->id,
        ]);
    }

    public function test_admin_can_review_submission(): void
    {
        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();
        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
        ]);

        $registration = Registration::factory()->create([
            'competition_id' => $competition->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::APPROVED,
        ]);

        $submission = Submission::create([
            'registration_id' => $registration->id,
            'status' => SubmissionStatus::SUBMITTED,
            'title' => 'Project Antigravity',
            'description' => 'Platform inovasi manajemen kompetisi IT.',
            'repository_url' => 'https://github.com/example/repo',
            'submitted_at' => now(),
        ]);

        // Review to accepted
        $response = $this->actingAs($this->admin)->patchJson("/api/v1/admin/submissions/{$submission->id}/review", [
            'status' => SubmissionStatus::ACCEPTED->value,
            'notes' => 'Karya memenuhi standar kompetisi.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', SubmissionStatus::ACCEPTED->value);

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => SubmissionStatus::ACCEPTED->value,
        ]);

        // Verify participant notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->participant->id,
            'type' => 'submission',
        ]);
    }

    public function test_csv_export_includes_anti_formula_injection_sanitization(): void
    {
        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();
        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
            'name' => '=cmd|/c calc!A0', // Potential CSV injection in competition name
        ]);

        Registration::factory()->create([
            'competition_id' => $competition->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::SUBMITTED,
            'admin_notes' => '+12345Formula', // Potential formula in note
        ]);

        $response = $this->actingAs($this->admin)->get('/api/v1/admin/reports/registrations');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        $content = $response->streamedContent();

        // Anti-formula injection check: '=cmd' must be escaped by prepending a single quote: '=cmd
        $this->assertStringContainsString("'=cmd|/c calc!A0", $content);
        $this->assertStringContainsString("'+12345Formula", $content);
    }

    public function test_admin_can_crud_announcements(): void
    {
        $event = Event::factory()->create();

        $createResponse = $this->actingAs($this->admin)->postJson('/api/v1/admin/announcements', [
            'event_id' => $event->id,
            'title' => 'Technical Meeting Info',
            'content' => 'TM akan dilaksanakan via Zoom.',
            'audience' => AnnouncementAudience::PUBLIC->value,
            'status' => AnnouncementStatus::PUBLISHED->value,
        ]);
        $createResponse->assertStatus(201)
            ->assertJsonPath('data.title', 'Technical Meeting Info');

        $announcementId = $createResponse->json('data.id');

        $updateResponse = $this->actingAs($this->admin)->putJson("/api/v1/admin/announcements/{$announcementId}", [
            'title' => 'Technical Meeting Info (Updated)',
            'content' => 'TM dipindahkan ke pukul 14:00 WIB.',
        ]);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.title', 'Technical Meeting Info (Updated)');

        $deleteResponse = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/announcements/{$announcementId}");
        $deleteResponse->assertStatus(200);
    }

    public function test_admin_can_crud_faqs(): void
    {
        $createResponse = $this->actingAs($this->admin)->postJson('/api/v1/admin/faqs', [
            'question' => 'Apakah pendaftaran gratis?',
            'answer' => 'Ya, seluruh cabang lomba tidak dipungut biaya.',
            'category' => 'Umum',
            'is_published' => true,
        ]);
        $createResponse->assertStatus(201)
            ->assertJsonPath('data.question', 'Apakah pendaftaran gratis?');

        $faqId = $createResponse->json('data.id');

        $deleteResponse = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/faqs/{$faqId}");
        $deleteResponse->assertStatus(200);
    }

    public function test_admin_can_view_audit_activity_logs(): void
    {
        ActivityLog::create([
            'user_id' => $this->admin->id,
            'action' => 'admin.audit_check',
            'entity_type' => 'System',
            'entity_id' => 1,
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/activity-logs');
        $response->assertStatus(200)
            ->assertJsonPath('data.data.0.action', 'admin.audit_check');
    }

    public function test_admin_can_crud_schedules(): void
    {
        $event = Event::factory()->create();

        // 1. Create schedule
        $res = $this->actingAs($this->admin)->postJson('/api/v1/admin/schedules', [
            'event_id' => $event->id,
            'title' => 'Technical Meeting Pembukaan',
            'description' => 'Penjelasan teknis dan regulasi lomba.',
            'start_at' => now()->addDays(2)->toDateTimeString(),
            'end_at' => now()->addDays(2)->addHours(2)->toDateTimeString(),
            'location' => 'Zoom Meeting & Gedung A',
            'meeting_url' => 'https://zoom.us/j/123456789',
            'is_published' => true,
        ]);
        $res->assertStatus(201)
            ->assertJsonPath('data.title', 'Technical Meeting Pembukaan');

        $scheduleId = $res->json('data.id');

        // 2. Read list
        $listRes = $this->actingAs($this->admin)->getJson("/api/v1/admin/schedules?event_id={$event->id}");
        $listRes->assertStatus(200);

        // 3. Update
        $upRes = $this->actingAs($this->admin)->putJson("/api/v1/admin/schedules/{$scheduleId}", [
            'title' => 'Technical Meeting Pembukaan (Diperbarui)',
        ]);
        $upRes->assertStatus(200)
            ->assertJsonPath('data.title', 'Technical Meeting Pembukaan (Diperbarui)');

        // 4. Delete
        $delRes = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/schedules/{$scheduleId}");
        $delRes->assertStatus(200);
        $this->assertDatabaseMissing('schedules', ['id' => $scheduleId]);
    }

    public function test_admin_can_get_and_update_settings(): void
    {
        // 1. Get
        $getRes = $this->actingAs($this->admin)->getJson('/api/v1/admin/settings');
        $getRes->assertStatus(200);

        // 2. Patch
        $patchRes = $this->actingAs($this->admin)->patchJson('/api/v1/admin/settings', [
            'settings' => [
                'site_name' => 'IT Competition 2026 Updated',
                'contact_email' => 'admin_updated@itcomp.test',
            ],
        ]);
        $patchRes->assertStatus(200)
            ->assertJsonPath('data.site_name', 'IT Competition 2026 Updated');

        $this->assertDatabaseHas('event_settings', [
            'setting_key' => 'site_name',
            'setting_value' => 'IT Competition 2026 Updated',
        ]);
    }

    public function test_participant_is_forbidden_from_all_admin_endpoints(): void
    {
        $endpoints = [
            ['GET', '/api/v1/admin/dashboard'],
            ['GET', '/api/v1/admin/registrations'],
            ['GET', '/api/v1/admin/submissions'],
            ['GET', '/api/v1/admin/events'],
            ['GET', '/api/v1/admin/categories'],
            ['GET', '/api/v1/admin/competitions'],
            ['GET', '/api/v1/admin/announcements'],
            ['GET', '/api/v1/admin/faqs'],
            ['GET', '/api/v1/admin/schedules'],
            ['GET', '/api/v1/admin/settings'],
            ['GET', '/api/v1/admin/activity-logs'],
            ['GET', '/api/v1/admin/reports/registrations'],
            ['GET', '/api/v1/admin/reports/submissions'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            $response = $this->actingAs($this->participant)->json($method, $uri);
            $response->assertStatus(403);
        }
    }

    public function test_registration_workflow_rejection_and_cancellation(): void
    {
        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();
        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
        ]);

        // 1. Rejection requires note
        $reg1 = Registration::factory()->create([
            'competition_id' => $competition->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::UNDER_REVIEW,
        ]);

        $failRes = $this->actingAs($this->admin)->patchJson("/api/v1/admin/registrations/{$reg1->id}/status", [
            'status' => RegistrationStatus::REJECTED->value,
            'note' => '',
        ]);
        $failRes->assertStatus(422);

        $succRes = $this->actingAs($this->admin)->patchJson("/api/v1/admin/registrations/{$reg1->id}/status", [
            'status' => RegistrationStatus::REJECTED->value,
            'note' => 'Dokumen identitas tidak valid.',
        ]);
        $succRes->assertStatus(200)
            ->assertJsonPath('data.status', RegistrationStatus::REJECTED->value);

        // 2. Illegal transition (approved -> submitted) is prevented
        $reg2 = Registration::factory()->create([
            'competition_id' => $competition->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::APPROVED,
        ]);

        $illegalRes = $this->actingAs($this->admin)->patchJson("/api/v1/admin/registrations/{$reg2->id}/status", [
            'status' => RegistrationStatus::SUBMITTED->value,
        ]);
        $illegalRes->assertStatus(422);
    }
}
