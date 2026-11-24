<?php

namespace Tests\Unit;

use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\ParticipantProfile;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\Submission;
use App\Models\SubmissionRevision;
use App\Models\User;
use App\Services\TeamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseRelationshipsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_has_profile_relation(): void
    {
        $user = User::factory()->create();
        $profile = ParticipantProfile::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(ParticipantProfile::class, $user->profile);
        $this->assertEquals($profile->id, $user->profile->id);
        $this->assertEquals($user->id, $profile->user->id);
    }

    public function test_user_team_relationships(): void
    {
        $leader = User::factory()->create();
        $member = User::factory()->create();

        $teamService = new TeamService();
        $team = $teamService->createTeam($leader, 'Alpha Team');
        $teamService->addMemberByEmail($team, $member->email);

        $team->load('members');

        $this->assertEquals($leader->id, $team->leader->id);
        $this->assertCount(2, $team->members);
        $this->assertTrue($team->members->contains($member));
    }

    public function test_event_and_competition_relationships(): void
    {
        $event = Event::factory()->create();
        $category = CompetitionCategory::factory()->create();
        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
        ]);

        $this->assertEquals($event->id, $competition->event->id);
        $this->assertEquals($category->id, $competition->category->id);
        $this->assertTrue($event->competitions->contains($competition));
        $this->assertTrue($category->competitions->contains($competition));
    }

    public function test_registration_and_document_relationships(): void
    {
        $registration = Registration::factory()->create();
        $document = RegistrationDocument::create([
            'registration_id' => $registration->id,
            'document_type' => 'student_id_card',
            'file_path' => 'documents/ktm.pdf',
            'original_filename' => 'ktm.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
        ]);

        $this->assertTrue($registration->documents->contains($document));
        $this->assertEquals($registration->id, $document->registration->id);
    }

    public function test_registration_and_submission_relationships(): void
    {
        $registration = Registration::factory()->create();
        $submission = Submission::create([
            'registration_id' => $registration->id,
            'title' => 'Sistem AI Monitoring',
            'description' => 'Solusi monitoring lingkungan',
            'submitted_at' => now(),
        ]);

        $revision = SubmissionRevision::create([
            'submission_id' => $submission->id,
            'file_path' => 'submissions/v1.zip',
            'revision_note' => 'Perbaikan awal',
            'submitted_at' => now(),
        ]);

        $this->assertTrue($registration->submissions->contains($submission));
        $this->assertTrue($submission->revisions->contains($revision));
        $this->assertEquals($submission->id, $revision->submission->id);
    }
}
