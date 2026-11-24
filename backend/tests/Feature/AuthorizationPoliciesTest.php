<?php

namespace Tests\Feature;

use App\Enums\RegistrationStatus;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\Team;
use App\Models\User;
use App\Policies\RegistrationDocumentPolicy;
use App\Policies\RegistrationPolicy;
use App\Policies\TeamPolicy;
use App\Services\TeamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationPoliciesTest extends TestCase
{
    use RefreshDatabase;

    private RegistrationPolicy $registrationPolicy;
    private TeamPolicy $teamPolicy;
    private RegistrationDocumentPolicy $documentPolicy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->registrationPolicy = new RegistrationPolicy();
        $this->teamPolicy = new TeamPolicy();
        $this->documentPolicy = new RegistrationDocumentPolicy();
    }

    public function test_participant_cannot_view_another_participants_registration(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $registration = Registration::factory()->create(['participant_id' => $owner->id]);

        // Owner can view
        $this->assertTrue($this->registrationPolicy->view($owner, $registration));

        // Stranger cannot view
        $this->assertFalse($this->registrationPolicy->view($stranger, $registration));
    }

    public function test_admin_can_view_and_manage_any_registration(): void
    {
        $admin = User::factory()->admin()->create();
        $owner = User::factory()->create();
        $registration = Registration::factory()->create(['participant_id' => $owner->id]);

        $this->assertTrue($this->registrationPolicy->before($admin, 'view'));
        $this->assertTrue($this->registrationPolicy->changeStatus($admin, $registration));
    }

    public function test_non_admin_cannot_change_registration_status(): void
    {
        $owner = User::factory()->create();
        $registration = Registration::factory()->create(['participant_id' => $owner->id]);

        $this->assertFalse($this->registrationPolicy->changeStatus($owner, $registration));
    }

    public function test_team_members_and_leader_can_view_team_registration(): void
    {
        $leader = User::factory()->create();
        $member = User::factory()->create();
        $stranger = User::factory()->create();

        $teamService = new TeamService();
        $team = $teamService->createTeam($leader, 'Team Nusantara');
        $teamService->addMemberByEmail($team, $member->email);

        $registration = Registration::factory()->create([
            'team_id' => $team->id,
            'participant_id' => null,
        ]);

        $this->assertTrue($this->registrationPolicy->view($leader, $registration));
        $this->assertTrue($this->registrationPolicy->view($member, $registration));
        $this->assertFalse($this->registrationPolicy->view($stranger, $registration));
    }

    public function test_participant_cannot_update_submitted_registration(): void
    {
        $owner = User::factory()->create();
        $registration = Registration::factory()->submitted()->create(['participant_id' => $owner->id]);

        // Submitted cannot be edited by participant without revision request
        $this->assertFalse($this->registrationPolicy->update($owner, $registration));
    }

    public function test_private_document_download_policy(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $admin = User::factory()->admin()->create();

        $registration = Registration::factory()->create(['participant_id' => $owner->id]);
        $document = RegistrationDocument::create([
            'registration_id' => $registration->id,
            'document_type' => 'student_id_card',
            'file_path' => 'documents/secret.pdf',
        ]);

        // Owner can download
        $this->assertTrue($this->documentPolicy->download($owner, $document));

        // Stranger cannot download
        $this->assertFalse($this->documentPolicy->download($stranger, $document));

        // Admin can download via before hook
        $this->assertTrue($this->documentPolicy->before($admin, 'download'));
    }

    public function test_team_mutation_blocked_when_active_submitted_registration_exists(): void
    {
        $leader = User::factory()->create();
        $member = User::factory()->create();

        $teamService = new TeamService();
        $team = $teamService->createTeam($leader, 'Team Horizon');

        // Without active registration, leader can mutate
        $this->assertTrue($this->teamPolicy->update($leader, $team));

        // Create an active submitted registration
        Registration::factory()->submitted()->create([
            'team_id' => $team->id,
            'participant_id' => null,
        ]);

        // Leader can no longer freely mutate team while registration is active/submitted
        $this->assertFalse($this->teamPolicy->update($leader, $team));
        $this->assertFalse($this->teamPolicy->addMember($leader, $team));
    }
}
