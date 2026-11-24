<?php

namespace Tests\Feature;

use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Enums\TeamMemberRole;
use App\Http\Resources\RegistrationResource;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\ParticipantProfile;
use App\Models\Registration;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class AdminRegistrationDetailTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $participant;
    protected Event $event;
    protected CompetitionCategory $category;
    protected Competition $individualCompetition;
    protected Competition $teamCompetition;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Admin Test',
            'email' => 'admin@itcomp.test',
            'role' => Role::ADMIN,
            'is_active' => true,
        ]);

        $this->participant = User::factory()->create([
            'name' => 'Peserta Utama',
            'email' => 'peserta@itcomp.test',
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        ParticipantProfile::create([
            'user_id' => $this->participant->id,
            'phone' => '081234567890',
            'institution' => 'Institut Teknologi Test',
            'education_level' => 'undergraduate',
        ]);

        $this->event = Event::factory()->create([
            'name' => 'IT Fest 2026',
            'status' => EventStatus::PUBLISHED,
        ]);

        $this->category = CompetitionCategory::factory()->create([
            'name' => 'Software Engineering',
        ]);

        $this->individualCompetition = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'name' => 'Competitive Programming',
            'registration_type' => RegistrationType::INDIVIDUAL,
            'status' => CompetitionStatus::PUBLISHED,
        ]);

        $this->teamCompetition = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'name' => 'Hackathon Web',
            'registration_type' => RegistrationType::TEAM,
            'status' => CompetitionStatus::PUBLISHED,
        ]);
    }

    /**
     * Skenario 1: Admin dapat membuka detail pendaftaran individual.
     */
    public function test_admin_can_view_individual_registration_detail(): void
    {
        $reg = Registration::factory()->create([
            'registration_number' => 'ITC-2026-IND01',
            'competition_id' => $this->individualCompetition->id,
            'participant_id' => $this->participant->id,
            'team_id' => null,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/registrations/{$reg->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'registration' => [
                        'id' => $reg->id,
                        'registration_number' => 'ITC-2026-IND01',
                        'status' => 'submitted',
                    ],
                ],
            ]);
    }

    /**
     * Skenario 2: Admin dapat membuka detail pendaftaran tim.
     */
    public function test_admin_can_view_team_registration_detail(): void
    {
        $team = Team::create([
            'name' => 'Garuda Tech',
            'team_code' => 'GRD-01',
            'leader_id' => $this->participant->id,
        ]);

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->participant->id,
            'member_role' => TeamMemberRole::LEADER,
            'joined_at' => now(),
        ]);

        $reg = Registration::factory()->create([
            'registration_number' => 'ITC-2026-TEAM01',
            'competition_id' => $this->teamCompetition->id,
            'participant_id' => null,
            'team_id' => $team->id,
            'status' => RegistrationStatus::UNDER_REVIEW,
        ]);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/registrations/{$reg->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'registration' => [
                        'id' => $reg->id,
                        'registration_number' => 'ITC-2026-TEAM01',
                        'status' => 'under_review',
                        'team' => [
                            'id' => $team->id,
                            'name' => 'Garuda Tech',
                        ],
                    ],
                ],
            ]);
    }

    /**
     * Skenario 3: Data participant dapat dimuat dengan benar pada pendaftaran individual.
     */
    public function test_participant_data_is_loaded_correctly(): void
    {
        $reg = Registration::factory()->create([
            'competition_id' => $this->individualCompetition->id,
            'participant_id' => $this->participant->id,
            'team_id' => null,
            'status' => RegistrationStatus::APPROVED,
        ]);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/registrations/{$reg->id}");

        $response->assertStatus(200);
        $data = $response->json('data.registration');

        $this->assertEquals($this->participant->id, $data['participant']['id'] ?? $data['user']['id']);
        $this->assertEquals('Peserta Utama', $data['participant']['name'] ?? $data['user']['name']);
        $this->assertEquals('peserta@itcomp.test', $data['participant']['email'] ?? $data['user']['email']);
    }

    /**
     * Skenario 4: Profile participant dapat dimuat jika tersedia.
     */
    public function test_participant_profile_is_loaded_when_available(): void
    {
        $reg = Registration::factory()->create([
            'competition_id' => $this->individualCompetition->id,
            'participant_id' => $this->participant->id,
            'team_id' => null,
        ]);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/registrations/{$reg->id}");

        $response->assertStatus(200);
        $userObj = $response->json('data.registration.participant') ?? $response->json('data.registration.user');

        $this->assertNotNull($userObj['profile']);
        $this->assertEquals('Institut Teknologi Test', $userObj['profile']['institution']);
        $this->assertEquals('081234567890', $userObj['profile']['phone']);
    }

    /**
     * Skenario 5: Data team dan anggotanya dapat dimuat tanpa error.
     */
    public function test_team_and_members_are_loaded_correctly(): void
    {
        $member2 = User::factory()->create([
            'name' => 'Anggota Dua',
            'email' => 'anggota2@itcomp.test',
            'role' => Role::PARTICIPANT,
        ]);
        ParticipantProfile::create([
            'user_id' => $member2->id,
            'institution' => 'Universitas Indonesia',
            'phone' => '089876543210',
        ]);

        $team = Team::create([
            'name' => 'Tim Juara',
            'team_code' => 'JRA-01',
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
            'user_id' => $member2->id,
            'member_role' => TeamMemberRole::MEMBER,
            'joined_at' => now(),
        ]);

        $reg = Registration::factory()->create([
            'competition_id' => $this->teamCompetition->id,
            'participant_id' => null,
            'team_id' => $team->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/registrations/{$reg->id}");

        $response->assertStatus(200);
        $teamData = $response->json('data.registration.team');

        $this->assertNotNull($teamData);
        $this->assertEquals('Tim Juara', $teamData['name']);
        $this->assertCount(2, $teamData['members']);

        // Assert member names and profiles exist
        $memberNames = collect($teamData['members'])->pluck('name')->toArray();
        $this->assertContains('Peserta Utama', $memberNames);
        $this->assertContains('Anggota Dua', $memberNames);
    }

    /**
     * Skenario 6: Data competition dapat dimuat.
     */
    public function test_competition_data_is_loaded_correctly(): void
    {
        $reg = Registration::factory()->create([
            'competition_id' => $this->individualCompetition->id,
            'participant_id' => $this->participant->id,
            'team_id' => null,
        ]);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/registrations/{$reg->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.registration.competition.id', $this->individualCompetition->id)
            ->assertJsonPath('data.registration.competition.name', 'Competitive Programming')
            ->assertJsonPath('data.registration.competition.category.name', 'Software Engineering')
            ->assertJsonPath('data.registration.competition.event.name', 'IT Fest 2026');
    }

    /**
     * Skenario 7: Pendaftaran dengan ID tidak valid menghasilkan 404.
     */
    public function test_invalid_registration_id_returns_404(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/registrations/999999');

        $response->assertStatus(404);
    }

    /**
     * Skenario 8: Participant tidak dapat mengakses endpoint detail admin (403).
     */
    public function test_participant_is_forbidden_from_admin_registration_detail(): void
    {
        $reg = Registration::factory()->create([
            'competition_id' => $this->individualCompetition->id,
            'participant_id' => $this->participant->id,
            'team_id' => null,
        ]);

        $response = $this->actingAs($this->participant)->getJson("/api/v1/admin/registrations/{$reg->id}");

        $response->assertStatus(403);
    }

    /**
     * Skenario 9: Tidak ada SQLSTATE error atau undefined relationship saat update status registrasi tim.
     */
    public function test_no_sqlstate_or_undefined_relationship_error_on_status_update(): void
    {
        $team = Team::create([
            'name' => 'Tim Cyber',
            'team_code' => 'CYB-01',
            'leader_id' => $this->participant->id,
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->participant->id,
            'member_role' => TeamMemberRole::LEADER,
            'joined_at' => now(),
        ]);

        $reg = Registration::factory()->create([
            'competition_id' => $this->teamCompetition->id,
            'participant_id' => null,
            'team_id' => $team->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        $response = $this->actingAs($this->admin)->patchJson("/api/v1/admin/registrations/{$reg->id}/status", [
            'status' => 'approved',
            'note' => 'Dokumen tim lengkap dan valid.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');
    }

    /**
     * Skenario 10: RegistrationResource serialization tidak mengakses relasi yang tidak tersedia.
     */
    public function test_registration_resource_serialization_does_not_access_undefined_relations(): void
    {
        $team = Team::create([
            'name' => 'Resource Test Team',
            'team_code' => 'RES-01',
            'leader_id' => $this->participant->id,
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->participant->id,
            'member_role' => TeamMemberRole::LEADER,
            'joined_at' => now(),
        ]);

        $reg = Registration::factory()->create([
            'competition_id' => $this->teamCompetition->id,
            'participant_id' => null,
            'team_id' => $team->id,
            'status' => RegistrationStatus::APPROVED,
        ]);

        $reg->load([
            'competition.category',
            'participant.profile',
            'user.profile',
            'team.members.profile',
            'documents',
            'submissions',
        ]);

        $resource = new RegistrationResource($reg);
        $request = Request::create("/api/v1/registrations/{$reg->id}", 'GET');
        $serialized = $resource->toArray($request);

        $this->assertIsArray($serialized);
        $this->assertEquals($reg->registration_number, $serialized['registration_number']);
        $this->assertArrayHasKey('team', $serialized);
        $this->assertArrayHasKey('participant', $serialized);
        $this->assertArrayHasKey('user', $serialized);
    }
}
