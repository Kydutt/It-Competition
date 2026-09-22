<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\CompetitionTargetLevel;
use App\Models\Competition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompetitionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_list_published_competitions(): void
    {
        Competition::create([
            'name' => 'UI/UX Competition',
            'slug' => 'ui-ux-competition',
            'category' => CompetitionCategory::UiUx,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Test UI/UX description',
            'registration_fee' => 75000,
            'quota' => 50,
            'min_team_member' => 1,
            'max_team_member' => 3,
            'status' => CompetitionStatus::RegistrationOpen,
            'is_published' => true,
        ]);

        Competition::create([
            'name' => 'Draft Competition',
            'slug' => 'draft-competition',
            'category' => CompetitionCategory::WebDevelopment,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Draft description',
            'status' => CompetitionStatus::Draft,
            'is_published' => false,
        ]);

        $response = $this->getJson('/api/v1/competitions');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Competitions retrieved successfully',
            ]);

        $data = $response->json('data.data');
        $this->assertCount(1, $data);
        $this->assertSame('ui-ux-competition', $data[0]['slug']);
    }

    public function test_public_can_filter_competitions_by_category_and_target_level(): void
    {
        Competition::create([
            'name' => 'UI/UX Competition',
            'slug' => 'ui-ux-competition',
            'category' => CompetitionCategory::UiUx,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Test UI/UX',
            'is_published' => true,
        ]);

        Competition::create([
            'name' => 'Poster Competition',
            'slug' => 'poster-competition',
            'category' => CompetitionCategory::Poster,
            'target_level' => CompetitionTargetLevel::HighSchool,
            'description' => 'Test Poster',
            'is_published' => true,
        ]);

        // Filter by category
        $resCat = $this->getJson('/api/v1/competitions?category=ui_ux');
        $resCat->assertStatus(200);
        $this->assertCount(1, $resCat->json('data.data'));
        $this->assertSame('ui-ux-competition', $resCat->json('data.data.0.slug'));

        // Filter by target_level
        $resLvl = $this->getJson('/api/v1/competitions?target_level=high_school');
        $resLvl->assertStatus(200);
        $this->assertCount(1, $resLvl->json('data.data'));
        $this->assertSame('poster-competition', $resLvl->json('data.data.0.slug'));
    }

    public function test_public_can_search_competitions(): void
    {
        Competition::create([
            'name' => 'Web Development Competition',
            'slug' => 'web-development-competition',
            'category' => CompetitionCategory::WebDevelopment,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Membangun aplikasi website interaktif',
            'is_published' => true,
        ]);

        Competition::create([
            'name' => 'LKTI Nasional',
            'slug' => 'lkti-nasional',
            'category' => CompetitionCategory::Lkti,
            'target_level' => CompetitionTargetLevel::HighSchool,
            'description' => 'Karya tulis ilmiah',
            'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/competitions?search=website');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.data'));
        $this->assertSame('web-development-competition', $response->json('data.data.0.slug'));
    }

    public function test_public_can_get_published_competition_by_slug(): void
    {
        $comp = Competition::create([
            'name' => 'Web Development Competition',
            'slug' => 'web-development-competition',
            'category' => CompetitionCategory::WebDevelopment,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Test Web Dev description',
            'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/competitions/'.$comp->slug);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $comp->id,
                    'slug' => 'web-development-competition',
                ],
            ]);
    }

    public function test_public_cannot_view_unpublished_competition_detail(): void
    {
        $comp = Competition::create([
            'name' => 'Hidden Competition',
            'slug' => 'hidden-competition',
            'category' => CompetitionCategory::WebDevelopment,
            'target_level' => CompetitionTargetLevel::University,
            'description' => 'Private draft',
            'is_published' => false,
        ]);

        $response = $this->getJson('/api/v1/competitions/'.$comp->slug);

        $response->assertStatus(404);
    }

    public function test_public_receives_404_for_invalid_slug(): void
    {
        $response = $this->getJson('/api/v1/competitions/non-existent-competition-slug');

        $response->assertStatus(404);
    }
}
