<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\CompetitionTargetLevel;
use App\Enums\CompetitionType;
use App\Enums\RegistrationStatus;
use App\Enums\TeamMemberRole;
use App\Enums\UserRole;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $participant1;

    protected User $participant2;

    protected User $highSchoolUser;

    protected Competition $teamComp;

    protected Competition $individualComp;

    protected function setUp(): void
    {
        parent::setUp();

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
            'institution' => 'Univ X',
        ]);

        $this->highSchoolUser = User::create([
            'name' => 'HS Student',
            'email' => 'hs@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Participant,
            'education_level' => 'high_school',
            'institution' => 'SMA 1',
        ]);

        $this->teamComp = Competition::create([
            'name' => 'Dev Challenge',
            'slug' => 'dev-challenge',
            'competition_type' => CompetitionType::Team,
            'category' => CompetitionCategory::WebDevelopment,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Dev Challenge Description',
            'min_team_member' => 2,
            'max_team_member' => 3,
            'status' => CompetitionStatus::RegistrationOpen,
            'is_published' => true,
        ]);

        $this->individualComp = Competition::create([
            'name' => 'Poster Single',
            'slug' => 'poster-single',
            'competition_type' => CompetitionType::Individual,
            'category' => CompetitionCategory::Poster,
            'target_level' => CompetitionTargetLevel::HighSchool,
            'description' => 'Poster Single Description',
            'min_team_member' => 1,
            'max_team_member' => 1,
            'status' => CompetitionStatus::RegistrationOpen,
            'is_published' => true,
        ]);
    }

    public function test_participant_can_create_draft_registration_for_individual_competition(): void
    {
        $response = $this->actingAs($this->highSchoolUser)
            ->postJson('/api/v1/participant/registrations', [
                'competition_id' => $this->individualComp->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.is_team_based', false);

        $this->assertDatabaseHas('registrations', [
            'competition_id' => $this->individualComp->id,
            'user_id' => $this->highSchoolUser->id,
            'team_id' => null,
            'status' => RegistrationStatus::Draft->value,
        ]);
    }

    public function test_cannot_submit_team_registration_if_minimum_members_not_met(): void
    {
        $team = Team::create([
            'competition_id' => $this->teamComp->id,
            'leader_id' => $this->participant1->id,
            'name' => 'Solo Team',
            'institution' => 'Univ X',
        ]);

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->participant1->id,
            'role' => TeamMemberRole::Leader,
        ]);

        $registration = Registration::create([
            'registration_number' => 'ITC-2026-TEST1',
            'competition_id' => $this->teamComp->id,
            'team_id' => $team->id,
            'user_id' => $this->participant1->id,
            'status' => RegistrationStatus::Draft,
        ]);

        // Only 1 member in team, min is 2 -> submission fails
        $response = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/registrations/{$registration->id}/submit");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['team']);
    }

    public function test_can_submit_registration_when_min_members_met(): void
    {
        $team = Team::create([
            'competition_id' => $this->teamComp->id,
            'leader_id' => $this->participant1->id,
            'name' => 'Duo Team',
            'institution' => 'Univ X',
        ]);

        TeamMember::create(['team_id' => $team->id, 'user_id' => $this->participant1->id, 'role' => TeamMemberRole::Leader]);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $this->participant2->id, 'role' => TeamMemberRole::Member]);

        $registration = Registration::create([
            'registration_number' => 'ITC-2026-TEST2',
            'competition_id' => $this->teamComp->id,
            'team_id' => $team->id,
            'user_id' => $this->participant1->id,
            'status' => RegistrationStatus::Draft,
        ]);

        $response = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/registrations/{$registration->id}/submit");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'submitted');

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => RegistrationStatus::Submitted->value,
        ]);
    }

    public function test_participant_can_cancel_draft_registration(): void
    {
        $registration = Registration::create([
            'registration_number' => 'ITC-2026-TEST3',
            'competition_id' => $this->individualComp->id,
            'user_id' => $this->highSchoolUser->id,
            'status' => RegistrationStatus::Draft,
        ]);

        $response = $this->actingAs($this->highSchoolUser)
            ->postJson("/api/v1/participant/registrations/{$registration->id}/cancel");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_admin_can_approve_submitted_registration(): void
    {
        $registration = Registration::create([
            'registration_number' => 'ITC-2026-TEST4',
            'competition_id' => $this->individualComp->id,
            'user_id' => $this->highSchoolUser->id,
            'status' => RegistrationStatus::Submitted,
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/registrations/{$registration->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => RegistrationStatus::Approved->value,
            'reviewed_by' => $this->admin->id,
        ]);
    }

    public function test_admin_can_reject_registration_with_reason(): void
    {
        $registration = Registration::create([
            'registration_number' => 'ITC-2026-TEST5',
            'competition_id' => $this->individualComp->id,
            'user_id' => $this->highSchoolUser->id,
            'status' => RegistrationStatus::Submitted,
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/registrations/{$registration->id}/reject", [
                'rejection_reason' => 'Identitas kartu pelajar tidak valid atau buram.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Identitas kartu pelajar tidak valid atau buram.');
    }

    public function test_admin_can_request_revision_and_participant_can_resubmit(): void
    {
        $team = Team::create([
            'competition_id' => $this->teamComp->id,
            'leader_id' => $this->participant1->id,
            'name' => 'Revision Team',
            'institution' => 'Univ X',
        ]);

        TeamMember::create(['team_id' => $team->id, 'user_id' => $this->participant1->id, 'role' => TeamMemberRole::Leader]);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $this->participant2->id, 'role' => TeamMemberRole::Member]);

        $registration = Registration::create([
            'registration_number' => 'ITC-2026-TEST6',
            'competition_id' => $this->teamComp->id,
            'team_id' => $team->id,
            'user_id' => $this->participant1->id,
            'status' => RegistrationStatus::Submitted,
            'submitted_at' => now(),
        ]);

        // Admin requests revision
        $response = $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/registrations/{$registration->id}/revision", [
                'revision_note' => 'KTM ketua tim terpotong, tolong upload ulang.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'revision_required');

        // Participant resubmits
        $resubmitResponse = $this->actingAs($this->participant1)
            ->postJson("/api/v1/participant/registrations/{$registration->id}/submit");

        $resubmitResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'submitted');
    }
}
