<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\CompetitionTargetLevel;
use App\Enums\UserRole;
use App\Models\Competition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompetitionAdminTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $participant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Admin,
        ]);

        $this->participant = User::create([
            'name' => 'Participant User',
            'email' => 'participant@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Participant,
        ]);
    }

    public function test_admin_can_list_all_competitions_including_unpublished(): void
    {
        Competition::create([
            'name' => 'Pub Comp',
            'slug' => 'pub-comp',
            'category' => CompetitionCategory::UiUx,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Published',
            'is_published' => true,
        ]);

        Competition::create([
            'name' => 'Draft Comp',
            'slug' => 'draft-comp',
            'category' => CompetitionCategory::WebDevelopment,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Draft',
            'status' => CompetitionStatus::Draft,
            'is_published' => false,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/competitions');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data.data'));
    }

    public function test_admin_can_create_competition_with_auto_generated_slug(): void
    {
        $payload = [
            'name' => 'Artificial Intelligence Challenge',
            'category' => 'web_development',
            'target_level' => 'university',
            'description' => 'Kompetisi AI tingkat lanjut.',
            'theme' => 'Smart City',
            'registration_fee' => 50000,
            'quota' => 50,
            'min_team_member' => 1,
            'max_team_member' => 3,
            'registration_start' => now()->toDateTimeString(),
            'registration_end' => now()->addDays(10)->toDateTimeString(),
            'submission_start' => now()->addDays(11)->toDateTimeString(),
            'submission_deadline' => now()->addDays(20)->toDateTimeString(),
            'is_published' => true,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/competitions', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Artificial Intelligence Challenge',
                    'slug' => 'artificial-intelligence-challenge',
                    'registration_fee' => 50000,
                    'is_published' => true,
                ],
            ]);

        $this->assertDatabaseHas('competitions', [
            'name' => 'Artificial Intelligence Challenge',
            'slug' => 'artificial-intelligence-challenge',
        ]);
    }

    public function test_admin_can_update_competition(): void
    {
        $comp = Competition::create([
            'name' => 'Old Title',
            'slug' => 'old-title',
            'category' => CompetitionCategory::UiUx,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Old description',
            'registration_fee' => 50000,
            'quota' => 30,
            'min_team_member' => 1,
            'max_team_member' => 2,
        ]);

        $response = $this->actingAs($this->admin)->putJson('/api/v1/admin/competitions/'.$comp->id, [
            'name' => 'New Title',
            'registration_fee' => 75000,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'New Title',
                    'registration_fee' => 75000,
                ],
            ]);

        $this->assertDatabaseHas('competitions', [
            'id' => $comp->id,
            'name' => 'New Title',
            'registration_fee' => 75000,
        ]);
    }

    public function test_admin_can_publish_and_unpublish_competition(): void
    {
        $comp = Competition::create([
            'name' => 'Toggle Comp',
            'slug' => 'toggle-comp',
            'category' => CompetitionCategory::UiUx,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Desc',
            'is_published' => false,
        ]);

        // Publish
        $pubRes = $this->actingAs($this->admin)->patchJson('/api/v1/admin/competitions/'.$comp->id.'/publish');
        $pubRes->assertStatus(200);
        $this->assertTrue($comp->fresh()->is_published);

        // Unpublish
        $unpubRes = $this->actingAs($this->admin)->patchJson('/api/v1/admin/competitions/'.$comp->id.'/unpublish');
        $unpubRes->assertStatus(200);
        $this->assertFalse($comp->fresh()->is_published);
    }

    public function test_admin_can_transition_status_through_valid_flow(): void
    {
        $comp = Competition::create([
            'name' => 'Flow Comp',
            'slug' => 'flow-comp',
            'category' => CompetitionCategory::UiUx,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Desc',
            'status' => CompetitionStatus::Draft,
        ]);

        // draft -> registration_open
        $res1 = $this->actingAs($this->admin)->patchJson('/api/v1/admin/competitions/'.$comp->id.'/status', [
            'status' => 'registration_open',
        ]);
        $res1->assertStatus(200);
        $this->assertSame(CompetitionStatus::RegistrationOpen, $comp->fresh()->status);

        // registration_open -> registration_closed
        $res2 = $this->actingAs($this->admin)->patchJson('/api/v1/admin/competitions/'.$comp->id.'/status', [
            'status' => 'registration_closed',
        ]);
        $res2->assertStatus(200);
        $this->assertSame(CompetitionStatus::RegistrationClosed, $comp->fresh()->status);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $comp = Competition::create([
            'name' => 'Finished Comp',
            'slug' => 'finished-comp',
            'category' => CompetitionCategory::UiUx,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Desc',
            'status' => CompetitionStatus::Finished,
        ]);

        // finished -> registration_open is invalid
        $res = $this->actingAs($this->admin)->patchJson('/api/v1/admin/competitions/'.$comp->id.'/status', [
            'status' => 'registration_open',
        ]);

        $res->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_validation_rejects_negative_fee(): void
    {
        $payload = [
            'name' => 'Negative Fee Comp',
            'category' => 'ui_ux',
            'target_level' => 'university',
            'description' => 'Desc',
            'registration_fee' => -5000,
            'quota' => 50,
            'min_team_member' => 1,
            'max_team_member' => 3,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/competitions', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['registration_fee']);
    }

    public function test_validation_rejects_invalid_team_size(): void
    {
        $payload = [
            'name' => 'Bad Team Size Comp',
            'category' => 'ui_ux',
            'target_level' => 'university',
            'description' => 'Desc',
            'registration_fee' => 0,
            'quota' => 50,
            'min_team_member' => 3,
            'max_team_member' => 1, // max < min
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/competitions', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['max_team_member']);
    }

    public function test_validation_rejects_invalid_date_ranges(): void
    {
        $payload = [
            'name' => 'Bad Dates Comp',
            'category' => 'ui_ux',
            'target_level' => 'university',
            'description' => 'Desc',
            'registration_fee' => 0,
            'quota' => 50,
            'min_team_member' => 1,
            'max_team_member' => 3,
            'registration_start' => now()->addDays(10)->toDateTimeString(),
            'registration_end' => now()->addDays(5)->toDateTimeString(), // end before start
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/competitions', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['registration_end']);
    }

    public function test_non_admin_cannot_access_admin_endpoints(): void
    {
        // Unauthenticated -> 401
        $guestRes = $this->getJson('/api/v1/admin/competitions');
        $guestRes->assertStatus(401);

        // Participant -> 403
        $partRes = $this->actingAs($this->participant)->getJson('/api/v1/admin/competitions');
        $partRes->assertStatus(403);
    }
}
