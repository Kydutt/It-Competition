<?php

namespace Tests\Feature;

use App\Enums\AnnouncementAudience;
use App\Enums\AnnouncementStatus;
use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Enums\TeamMemberRole;
use App\Models\Announcement;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\Notification;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParticipantDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $participant;
    protected User $otherParticipant;
    protected User $admin;
    protected Event $event;
    protected CompetitionCategory $category;
    protected Competition $competitionInd;
    protected Competition $competitionTeam;

    protected function setUp(): void
    {
        parent::setUp();

        $this->participant = User::factory()->create([
            'name' => 'Peserta Satu',
            'email' => 'peserta1@itcomp.test',
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        $this->otherParticipant = User::factory()->create([
            'name' => 'Peserta Lain',
            'email' => 'peserta_lain@itcomp.test',
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'name' => 'Admin Satu',
            'email' => 'admin@itcomp.test',
            'role' => Role::ADMIN,
            'is_active' => true,
        ]);

        $this->event = Event::factory()->create([
            'status' => EventStatus::PUBLISHED,
        ]);

        $this->category = CompetitionCategory::factory()->create();

        $this->competitionInd = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'name' => 'Competitive Programming',
            'registration_type' => RegistrationType::INDIVIDUAL,
            'status' => CompetitionStatus::PUBLISHED,
            'registration_deadline' => now()->addDays(5),
            'submission_deadline' => now()->addDays(15),
        ]);

        $this->competitionTeam = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'name' => 'Web App Contest',
            'registration_type' => RegistrationType::TEAM,
            'status' => CompetitionStatus::PUBLISHED,
            'registration_deadline' => now()->addDays(7),
            'submission_deadline' => now()->addDays(20),
        ]);
    }

    /**
     * Skenario B: Participant tanpa pendaftaran (empty state).
     */
    public function test_participant_without_registrations_gets_clean_empty_metrics(): void
    {
        $response = $this->actingAs($this->participant)->getJson('/api/v1/participant/dashboard');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status_counts.total', 0)
            ->assertJsonPath('data.status_counts.approved', 0)
            ->assertJsonPath('data.status_counts.submitted', 0)
            ->assertJsonPath('data.status_counts.draft', 0)
            ->assertJsonPath('data.recent_registrations', [])
            ->assertJsonPath('data.upcoming_deadlines', []);
    }

    /**
     * Skenario C: Participant dengan pendaftaran individual.
     */
    public function test_participant_with_individual_registration_loads_properly(): void
    {
        $reg = Registration::factory()->create([
            'registration_number' => 'ITC-2026-IND01',
            'competition_id' => $this->competitionInd->id,
            'participant_id' => $this->participant->id,
            'team_id' => null,
            'status' => RegistrationStatus::APPROVED,
        ]);

        // Add a submission
        Submission::create([
            'registration_id' => $reg->id,
            'title' => 'Solusi Algoritma',
            'description' => 'Solusi problem set A-E',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($this->participant)->getJson('/api/v1/participant/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.status_counts.total', 1)
            ->assertJsonPath('data.status_counts.approved', 1)
            ->assertJsonPath('data.recent_registrations.0.registration_number', 'ITC-2026-IND01')
            ->assertJsonPath('data.recent_registrations.0.competition.name', 'Competitive Programming')
            ->assertJsonPath('data.upcoming_deadlines.0.competition_name', 'Competitive Programming');
    }

    /**
     * Skenario D: Participant dengan pendaftaran tim (sebagai ketua atau anggota).
     */
    public function test_participant_with_team_registration_loads_without_duplicate_count(): void
    {
        $team = Team::create([
            'name' => 'Tim Hebat',
            'team_code' => 'THB-01',
            'leader_id' => $this->participant->id,
        ]);

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->participant->id,
            'member_role' => TeamMemberRole::LEADER,
            'joined_at' => now(),
        ]);

        $reg = Registration::factory()->create([
            'registration_number' => 'ITC-2026-TM01',
            'competition_id' => $this->competitionTeam->id,
            'participant_id' => null,
            'team_id' => $team->id,
            'status' => RegistrationStatus::UNDER_REVIEW,
        ]);

        $response = $this->actingAs($this->participant)->getJson('/api/v1/participant/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.status_counts.total', 1)
            ->assertJsonPath('data.status_counts.under_review', 1)
            ->assertJsonPath('data.recent_registrations.0.registration_number', 'ITC-2026-TM01')
            ->assertJsonPath('data.recent_registrations.0.team.name', 'Tim Hebat');
    }

    /**
     * Skenario A: Participant dengan data lengkap (individual, team, notifications, announcements).
     */
    public function test_participant_with_complete_data(): void
    {
        // 1. Individual Registration
        Registration::factory()->create([
            'registration_number' => 'ITC-2026-00001',
            'competition_id' => $this->competitionInd->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::APPROVED,
        ]);

        // 2. Team Registration
        $team = Team::create([
            'name' => 'Satu Arah',
            'team_code' => 'STA-01',
            'leader_id' => $this->participant->id,
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->participant->id,
            'member_role' => TeamMemberRole::LEADER,
            'joined_at' => now(),
        ]);
        Registration::factory()->create([
            'registration_number' => 'ITC-2026-00002',
            'competition_id' => $this->competitionTeam->id,
            'team_id' => $team->id,
            'status' => RegistrationStatus::DRAFT,
        ]);

        // 3. Notifications
        Notification::create([
            'user_id' => $this->participant->id,
            'title' => 'Pendaftaran Diterima',
            'message' => 'Pendaftaran Anda telah disetujui panitia.',
            'type' => 'registration_approved',
            'read_at' => null,
        ]);

        // 4. Announcements
        Announcement::create([
            'event_id' => $this->event->id,
            'title' => 'Pengumuman Penting',
            'slug' => 'pengumuman-penting',
            'content' => 'Isi pengumuman untuk seluruh peserta.',
            'audience' => AnnouncementAudience::ALL_PARTICIPANTS,
            'status' => AnnouncementStatus::PUBLISHED,
            'published_at' => now(),
        ]);

        $response = $this->actingAs($this->participant)->getJson('/api/v1/participant/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.status_counts.total', 2)
            ->assertJsonPath('data.status_counts.approved', 1)
            ->assertJsonPath('data.status_counts.draft', 1)
            ->assertJsonPath('data.unread_notifications_count', 1)
            ->assertJsonCount(2, 'data.recent_registrations')
            ->assertJsonCount(1, 'data.notifications')
            ->assertJsonCount(1, 'data.announcements');
    }

    /**
     * Skenario E1: Data isolation - participant tidak melihat pendaftaran participant lain.
     */
    public function test_participant_cannot_see_other_participants_registrations(): void
    {
        // Registration belonging to other participant
        Registration::factory()->create([
            'registration_number' => 'ITC-2026-OTHER01',
            'competition_id' => $this->competitionInd->id,
            'participant_id' => $this->otherParticipant->id,
            'status' => RegistrationStatus::APPROVED,
        ]);

        $response = $this->actingAs($this->participant)->getJson('/api/v1/participant/dashboard');

        $response->assertOk()
            ->assertJsonPath('data.status_counts.total', 0)
            ->assertJsonPath('data.recent_registrations', []);
    }

    /**
     * Skenario E2: Admin tidak dapat mengakses endpoint participant (403).
     */
    public function test_admin_is_forbidden_from_participant_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/participant/dashboard');

        $response->assertStatus(403);
    }

    /**
     * Skenario E3: Pengguna tanpa autentikasi ditolak (401).
     */
    public function test_unauthenticated_user_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/participant/dashboard');

        $response->assertStatus(401);
    }
}
