<?php

namespace Tests\Feature;

use App\Enums\CompetitionStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Models\ActivityLog;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompetitionAndCategoryDeleteTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $participant;
    protected Event $event;
    protected CompetitionCategory $category;

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

        $this->event = Event::factory()->create();
        $this->category = CompetitionCategory::factory()->create();
    }

    // ==========================================
    // COMPETITION DELETE TESTS
    // ==========================================

    public function test_admin_can_delete_eligible_competition(): void
    {
        $competition = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
            'status' => CompetitionStatus::DRAFT,
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/competitions/{$competition->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Cabang kompetisi berhasil dihapus.');

        // Soft deleted
        $this->assertSoftDeleted('competitions', ['id' => $competition->id]);

        // Audit log created
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'competition.delete',
            'entity_type' => 'Competition',
            'entity_id' => $competition->id,
            'user_id' => $this->admin->id,
        ]);
    }

    public function test_competition_with_registrations_cannot_be_deleted(): void
    {
        $competition = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
        ]);

        $registration = Registration::factory()->create([
            'competition_id' => $competition->id,
            'participant_id' => $this->participant->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        $submission = Submission::create([
            'registration_id' => $registration->id,
            'title' => 'Karya Final Peserta',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/competitions/{$competition->id}");

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['message']);

        $this->assertStringContainsString('tidak dapat dihapus', $response->json('message'));
        $this->assertStringContainsString('pendaftaran', $response->json('message'));

        // Ensure competition is NOT deleted
        $this->assertDatabaseHas('competitions', [
            'id' => $competition->id,
            'deleted_at' => null,
        ]);

        // Ensure registration and submission are completely intact
        $this->assertDatabaseHas('registrations', ['id' => $registration->id]);
        $this->assertDatabaseHas('submissions', ['id' => $submission->id]);
    }

    public function test_participant_cannot_delete_competition(): void
    {
        $competition = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->participant)
            ->deleteJson("/api/v1/admin/competitions/{$competition->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('competitions', [
            'id' => $competition->id,
            'deleted_at' => null,
        ]);
    }

    public function test_unauthenticated_user_cannot_delete_competition(): void
    {
        $competition = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->deleteJson("/api/v1/admin/competitions/{$competition->id}");

        $response->assertStatus(401);
        $this->assertDatabaseHas('competitions', [
            'id' => $competition->id,
            'deleted_at' => null,
        ]);
    }

    public function test_deleting_non_existent_competition_returns_404(): void
    {
        $response = $this->actingAs($this->admin)
            ->deleteJson('/api/v1/admin/competitions/999999');

        $response->assertStatus(404);
    }

    // ==========================================
    // CATEGORY DELETE TESTS
    // ==========================================

    public function test_admin_can_delete_unused_category(): void
    {
        $category = CompetitionCategory::factory()->create([
            'name' => 'Data Science & AI',
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Kategori kompetisi berhasil dihapus.');

        $this->assertDatabaseMissing('competition_categories', ['id' => $category->id]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'category.delete',
            'entity_type' => 'CompetitionCategory',
            'entity_id' => $category->id,
            'user_id' => $this->admin->id,
        ]);
    }

    public function test_category_used_by_competitions_cannot_be_deleted(): void
    {
        $category = CompetitionCategory::factory()->create([
            'name' => 'Software Engineering',
        ]);

        $comp1 = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $category->id,
            'name' => 'Web App Challenge',
        ]);

        $comp2 = Competition::factory()->create([
            'event_id' => $this->event->id,
            'category_id' => $category->id,
            'name' => 'Mobile App Contest',
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/admin/categories/{$category->id}");

        $response->assertStatus(409)
            ->assertJsonPath('success', false)
            ->assertJsonPath('data.competitions_count', 2);

        $message = $response->json('message');
        $this->assertStringContainsString('tidak dapat dihapus', $message);
        $this->assertStringContainsString('Web App Challenge', $message);

        // Category remains in database
        $this->assertDatabaseHas('competition_categories', ['id' => $category->id]);

        // Competitions remain intact
        $this->assertDatabaseHas('competitions', ['id' => $comp1->id]);
        $this->assertDatabaseHas('competitions', ['id' => $comp2->id]);
    }

    public function test_participant_cannot_delete_category(): void
    {
        $category = CompetitionCategory::factory()->create();

        $response = $this->actingAs($this->participant)
            ->deleteJson("/api/v1/admin/categories/{$category->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('competition_categories', ['id' => $category->id]);
    }

    public function test_unauthenticated_user_cannot_delete_category(): void
    {
        $category = CompetitionCategory::factory()->create();

        $response = $this->deleteJson("/api/v1/admin/categories/{$category->id}");

        $response->assertStatus(401);
        $this->assertDatabaseHas('competition_categories', ['id' => $category->id]);
    }

    public function test_deleting_non_existent_category_returns_404(): void
    {
        $response = $this->actingAs($this->admin)
            ->deleteJson('/api/v1/admin/categories/999999');

        $response->assertStatus(404);
    }
}
