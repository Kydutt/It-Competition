<?php

namespace Tests\Feature;

use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Enums\SubmissionStatus;
use App\Models\Competition;
use App\Models\Event;
use App\Models\Notification;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\Submission;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ParticipantPortalApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $participant;
    protected User $otherParticipant;
    protected Competition $individualCompetition;
    protected Competition $teamCompetition;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Storage::fake('local');

        $this->participant = User::factory()->create([
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        $this->otherParticipant = User::factory()->create([
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        $event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);

        $this->individualCompetition = Competition::factory()->create([
            'event_id' => $event->id,
            'registration_type' => RegistrationType::INDIVIDUAL,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
            'registration_start' => now()->subDay(),
            'registration_deadline' => now()->addDays(10),
        ]);

        $this->teamCompetition = Competition::factory()->create([
            'event_id' => $event->id,
            'registration_type' => RegistrationType::TEAM,
            'min_members' => 2,
            'max_members' => 3,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
            'registration_start' => now()->subDay(),
            'registration_deadline' => now()->addDays(10),
        ]);
    }

    public function test_participant_can_view_dashboard(): void
    {
        $response = $this->actingAs($this->participant)
            ->getJson('/api/v1/participant/dashboard');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'status_counts',
                    'recent_registrations',
                    'announcements',
                    'notifications',
                    'unread_notifications_count',
                    'upcoming_deadlines',
                ],
            ]);
    }

    public function test_participant_can_view_and_update_profile(): void
    {
        $showRes = $this->actingAs($this->participant)
            ->getJson('/api/v1/participant/profile');

        $showRes->assertOk()
            ->assertJsonPath('data.email', $this->participant->email);

        $updateRes = $this->actingAs($this->participant)
            ->putJson('/api/v1/participant/profile', [
                'name' => 'Budi Perkasa',
                'phone' => '081298765432',
                'institution' => 'Institut Teknologi Bangsa',
                'education_level' => 'sarjana',
                'address' => 'Jl. Merdeka No. 45',
            ]);

        $updateRes->assertOk()
            ->assertJsonPath('data.name', 'Budi Perkasa')
            ->assertJsonPath('data.profile.phone', '081298765432')
            ->assertJsonPath('data.profile.institution', 'Institut Teknologi Bangsa');
    }

    public function test_participant_can_upload_avatar(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $response = $this->actingAs($this->participant)
            ->postJson('/api/v1/participant/profile/avatar', [
                'avatar' => $file,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_team_management_flow(): void
    {
        // 1. Create team
        $createRes = $this->actingAs($this->participant)
            ->postJson('/api/v1/participant/teams', [
                'name' => 'Garuda Tech',
            ]);

        $createRes->assertCreated()
            ->assertJsonPath('data.name', 'Garuda Tech');

        $teamId = $createRes->json('data.id');

        // 2. Add member
        $addRes = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/teams/{$teamId}/members", [
                'email' => $this->otherParticipant->email,
            ]);

        $addRes->assertOk();

        // 3. Remove member
        $removeRes = $this->actingAs($this->participant)
            ->deleteJson("/api/v1/participant/teams/{$teamId}/members/{$this->otherParticipant->id}");

        $removeRes->assertOk();
    }

    public function test_individual_registration_draft_and_document_upload_and_submit(): void
    {
        // 1. Create draft
        $draftRes = $this->actingAs($this->participant)
            ->postJson('/api/v1/participant/registrations', [
                'competition_id' => $this->individualCompetition->id,
                'notes' => 'Catatan peserta draf',
            ]);

        $draftRes->assertCreated()
            ->assertJsonPath('data.status', RegistrationStatus::DRAFT->value);

        $regId = $draftRes->json('data.id');
        $registration = Registration::find($regId);

        // 2. Upload document
        $docFile = UploadedFile::fake()->create('ktm_peserta.pdf', 500, 'application/pdf');

        $uploadRes = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$regId}/documents", [
                'document_type' => 'ktm',
                'file' => $docFile,
            ]);

        $uploadRes->assertOk()
            ->assertJsonPath('data.document_type', 'ktm');

        $docId = $uploadRes->json('data.id');
        $doc = RegistrationDocument::find($docId);

        // 3. Authorized download
        $downloadRes = $this->actingAs($this->participant)
            ->get("/api/v1/participant/documents/{$docId}/download");

        $downloadRes->assertOk();

        // 4. Unauthorized download by another participant
        $unauthRes = $this->actingAs($this->otherParticipant)
            ->get("/api/v1/participant/documents/{$docId}/download");

        $unauthRes->assertForbidden();

        // 5. Submit registration
        $submitRes = $this->actingAs($this->participant)
            ->postJson("/api/v1/participant/registrations/{$regId}/submit");

        $submitRes->assertOk()
            ->assertJsonPath('data.status', RegistrationStatus::SUBMITTED->value);
    }

    public function test_participant_can_submit_work_when_approved(): void
    {
        $reg = Registration::factory()->create([
            'participant_id' => $this->participant->id,
            'competition_id' => $this->individualCompetition->id,
            'status' => RegistrationStatus::APPROVED,
        ]);

        $workFile = UploadedFile::fake()->create('proposal_karya.pdf', 1000, 'application/pdf');

        $response = $this->actingAs($this->participant)
            ->postJson('/api/v1/participant/submissions', [
                'registration_id' => $reg->id,
                'title' => 'Sistem AI Prediksi Banjir',
                'description' => 'Aplikasi IoT dan Web AI',
                'file' => $workFile,
                'repository_url' => 'https://github.com/itcomp/ai-flood',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Sistem AI Prediksi Banjir');
    }

    public function test_participant_can_manage_notifications(): void
    {
        $notif = Notification::create([
            'user_id' => $this->participant->id,
            'title' => 'Verifikasi Selesai',
            'message' => 'Pendaftaran Anda telah disetujui.',
            'type' => 'registration_approved',
        ]);

        $listRes = $this->actingAs($this->participant)
            ->getJson('/api/v1/participant/notifications');

        $listRes->assertOk()
            ->assertJsonFragment(['title' => 'Verifikasi Selesai']);

        $readRes = $this->actingAs($this->participant)
            ->patchJson("/api/v1/participant/notifications/{$notif->id}/read");

        $readRes->assertOk()
            ->assertJsonPath('data.is_read', true);
    }
}
