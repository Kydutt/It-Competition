<?php

namespace Tests\Unit;

use App\Enums\CompetitionStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\Team;
use App\Models\User;
use App\Services\RegistrationService;
use App\Services\TeamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class RegistrationBusinessRulesTest extends TestCase
{
    use RefreshDatabase;

    private RegistrationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new RegistrationService();
    }

    public function test_generates_sequential_registration_numbers(): void
    {
        $year = date('Y');
        $num1 = $this->service->generateRegistrationNumber();
        $this->assertEquals("ITC-{$year}-00001", $num1);

        Registration::factory()->create(['registration_number' => $num1]);

        $num2 = $this->service->generateRegistrationNumber();
        $this->assertEquals("ITC-{$year}-00002", $num2);
    }

    public function test_registration_status_transition_rules(): void
    {
        // Draft can transition to submitted and cancelled
        $this->assertTrue(RegistrationStatus::DRAFT->canTransitionTo(RegistrationStatus::SUBMITTED));
        $this->assertTrue(RegistrationStatus::DRAFT->canTransitionTo(RegistrationStatus::CANCELLED));
        $this->assertFalse(RegistrationStatus::DRAFT->canTransitionTo(RegistrationStatus::APPROVED));

        // Submitted can transition to under_review, revision_required, approved, rejected
        $this->assertTrue(RegistrationStatus::SUBMITTED->canTransitionTo(RegistrationStatus::UNDER_REVIEW));
        $this->assertTrue(RegistrationStatus::SUBMITTED->canTransitionTo(RegistrationStatus::APPROVED));
        $this->assertFalse(RegistrationStatus::SUBMITTED->canTransitionTo(RegistrationStatus::DRAFT));

        // Approved is terminal
        $this->assertFalse(RegistrationStatus::APPROVED->canTransitionTo(RegistrationStatus::REJECTED));
        $this->assertFalse(RegistrationStatus::APPROVED->canTransitionTo(RegistrationStatus::DRAFT));
    }

    public function test_individual_participant_cannot_create_duplicate_registration_in_same_competition(): void
    {
        $user = User::factory()->create();
        $competition = Competition::factory()->create([
            'registration_type' => RegistrationType::INDIVIDUAL,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
            'registration_start' => now()->subDay(),
            'registration_deadline' => now()->addDay(),
        ]);

        // First registration succeeds
        $this->service->createDraft($user, $competition);

        // Second registration must fail with validation exception
        $this->expectException(ValidationException::class);
        $this->service->createDraft($user, $competition);
    }

    public function test_team_registration_enforces_minimum_and_maximum_members(): void
    {
        $leader = User::factory()->create();
        $teamService = new TeamService();
        $team = $teamService->createTeam($leader, 'Garuda Team');

        $competition = Competition::factory()->create([
            'registration_type' => RegistrationType::TEAM,
            'min_members' => 2,
            'max_members' => 3,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
            'registration_start' => now()->subDay(),
            'registration_deadline' => now()->addDay(),
        ]);

        // Team currently has only 1 member (leader), which is < min_members (2)
        try {
            $this->service->createDraft($leader, $competition, ['team_id' => $team->id]);
            $this->fail('Expected ValidationException for member count under minimum.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('team_id', $e->errors());
        }

        // Add 1 member -> total 2 members (valid)
        $member1 = User::factory()->create();
        $teamService->addMemberByEmail($team, $member1->email);

        $registration = $this->service->createDraft($leader, $competition, ['team_id' => $team->id]);
        $this->assertEquals(RegistrationStatus::DRAFT, $registration->status);
    }

    public function test_cannot_register_when_competition_is_closed_or_expired(): void
    {
        $user = User::factory()->create();
        $competition = Competition::factory()->create([
            'status' => CompetitionStatus::REGISTRATION_CLOSED,
            'registration_start' => now()->subDays(10),
            'registration_deadline' => now()->subDays(2),
        ]);

        $this->expectException(ValidationException::class);
        $this->service->createDraft($user, $competition);
    }
}
