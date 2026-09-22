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

class TeamTest extends TestCase
{
    use RefreshDatabase;

    protected User $universityUser1;

    protected User $universityUser2;

    protected User $universityUser3;

    protected User $highSchoolUser;

    protected Competition $teamCompetition;

    protected Competition $individualCompetition;

    protected function setUp(): void
    {
        parent::setUp();

        $this->universityUser1 = User::create([
            'name' => 'Uni User 1',
            'email' => 'uni1@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Participant,
            'education_level' => 'university',
            'institution' => 'Univ A',
        ]);

        $this->universityUser2 = User::create([
            'name' => 'Uni User 2',
            'email' => 'uni2@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Participant,
            'education_level' => 'university',
            'institution' => 'Univ A',
        ]);

        $this->universityUser3 = User::create([
            'name' => 'Uni User 3',
            'email' => 'uni3@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Participant,
            'education_level' => 'university',
            'institution' => 'Univ B',
        ]);

        $this->highSchoolUser = User::create([
            'name' => 'High School User',
            'email' => 'hs@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Participant,
            'education_level' => 'high_school',
            'institution' => 'SMA 1',
        ]);

        $this->teamCompetition = Competition::create([
            'name' => 'Web Dev Battle',
            'slug' => 'web-dev-battle',
            'competition_type' => CompetitionType::Team,
            'category' => CompetitionCategory::WebDevelopment,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Test Comp',
            'min_team_member' => 2,
            'max_team_member' => 2,
            'status' => CompetitionStatus::RegistrationOpen,
            'is_published' => true,
        ]);

        $this->individualCompetition = Competition::create([
            'name' => 'Poster Single',
            'slug' => 'poster-single',
            'competition_type' => CompetitionType::Individual,
            'category' => CompetitionCategory::Poster,
            'target_level' => CompetitionTargetLevel::HighSchool,
            'description' => 'Poster Comp',
            'min_team_member' => 1,
            'max_team_member' => 1,
            'status' => CompetitionStatus::RegistrationOpen,
            'is_published' => true,
        ]);
    }

    public function test_participant_can_create_team(): void
    {
        $response = $this->actingAs($this->universityUser1)
            ->postJson('/api/v1/participant/teams', [
                'competition_id' => $this->teamCompetition->id,
                'name' => 'Alpha Team',
                'institution' => 'Univ A',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Alpha Team')
            ->assertJsonPath('data.leader_id', $this->universityUser1->id);

        $this->assertDatabaseHas('teams', [
            'name' => 'Alpha Team',
            'leader_id' => $this->universityUser1->id,
        ]);

        $this->assertDatabaseHas('team_members', [
            'user_id' => $this->universityUser1->id,
            'role' => TeamMemberRole::Leader->value,
        ]);
    }

    public function test_cannot_create_team_for_individual_competition(): void
    {
        $response = $this->actingAs($this->highSchoolUser)
            ->postJson('/api/v1/participant/teams', [
                'competition_id' => $this->individualCompetition->id,
                'name' => 'Single Squad',
                'institution' => 'SMA 1',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['competition_id']);
    }

    public function test_cannot_create_team_if_education_level_mismatch(): void
    {
        $response = $this->actingAs($this->highSchoolUser)
            ->postJson('/api/v1/participant/teams', [
                'competition_id' => $this->teamCompetition->id,
                'name' => 'HS Team in Uni Comp',
                'institution' => 'SMA 1',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user']);
    }

    public function test_participant_can_join_team_with_code(): void
    {
        // User 1 creates team
        $this->actingAs($this->universityUser1)->postJson('/api/v1/participant/teams', [
            'competition_id' => $this->teamCompetition->id,
            'name' => 'Beta Team',
            'institution' => 'Univ A',
        ]);

        $team = Team::where('name', 'Beta Team')->first();
        $this->assertNotNull($team);

        // User 2 joins team using code
        $response = $this->actingAs($this->universityUser2)->postJson('/api/v1/participant/teams/join', [
            'code' => $team->code,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $this->universityUser2->id,
            'role' => TeamMemberRole::Member->value,
        ]);
    }

    public function test_cannot_join_if_team_is_at_max_capacity(): void
    {
        $this->actingAs($this->universityUser1)->postJson('/api/v1/participant/teams', [
            'competition_id' => $this->teamCompetition->id,
            'name' => 'Full Team',
            'institution' => 'Univ A',
        ]);

        $team = Team::where('name', 'Full Team')->first();

        // 2nd member joins (reaches max 2)
        $this->actingAs($this->universityUser2)->postJson('/api/v1/participant/teams/join', [
            'code' => $team->code,
        ])->assertStatus(201);

        // 3rd member tries to join -> rejected
        $response = $this->actingAs($this->universityUser3)->postJson('/api/v1/participant/teams/join', [
            'code' => $team->code,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_leader_can_remove_member(): void
    {
        $team = Team::create([
            'competition_id' => $this->teamCompetition->id,
            'leader_id' => $this->universityUser1->id,
            'name' => 'Team To Remove',
            'institution' => 'Univ A',
        ]);

        TeamMember::create(['team_id' => $team->id, 'user_id' => $this->universityUser1->id, 'role' => TeamMemberRole::Leader]);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $this->universityUser2->id, 'role' => TeamMemberRole::Member]);

        $response = $this->actingAs($this->universityUser1)
            ->deleteJson("/api/v1/participant/teams/{$team->id}/members/{$this->universityUser2->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('team_members', [
            'team_id' => $team->id,
            'user_id' => $this->universityUser2->id,
        ]);
    }

    public function test_leader_can_transfer_leadership(): void
    {
        $team = Team::create([
            'competition_id' => $this->teamCompetition->id,
            'leader_id' => $this->universityUser1->id,
            'name' => 'Leadership Transfer Team',
            'institution' => 'Univ A',
        ]);

        TeamMember::create(['team_id' => $team->id, 'user_id' => $this->universityUser1->id, 'role' => TeamMemberRole::Leader]);
        TeamMember::create(['team_id' => $team->id, 'user_id' => $this->universityUser2->id, 'role' => TeamMemberRole::Member]);

        $response = $this->actingAs($this->universityUser1)
            ->postJson("/api/v1/participant/teams/{$team->id}/transfer-leadership", [
                'user_id' => $this->universityUser2->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.leader_id', $this->universityUser2->id);

        $this->assertDatabaseHas('teams', [
            'id' => $team->id,
            'leader_id' => $this->universityUser2->id,
        ]);

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $this->universityUser2->id,
            'role' => TeamMemberRole::Leader->value,
        ]);
    }

    public function test_team_is_locked_after_registration_submitted(): void
    {
        $team = Team::create([
            'competition_id' => $this->teamCompetition->id,
            'leader_id' => $this->universityUser1->id,
            'name' => 'Locked Team',
            'institution' => 'Univ A',
        ]);

        TeamMember::create(['team_id' => $team->id, 'user_id' => $this->universityUser1->id, 'role' => TeamMemberRole::Leader]);

        Registration::create([
            'registration_number' => 'ITC-2026-99999',
            'competition_id' => $this->teamCompetition->id,
            'team_id' => $team->id,
            'user_id' => $this->universityUser1->id,
            'status' => RegistrationStatus::Submitted,
            'submitted_at' => now(),
        ]);

        // User 2 attempts to join locked team
        $response = $this->actingAs($this->universityUser2)->postJson('/api/v1/participant/teams/join', [
            'code' => $team->code,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }
}
