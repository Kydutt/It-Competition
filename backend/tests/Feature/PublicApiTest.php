<?php

namespace Tests\Feature;

use App\Enums\AnnouncementAudience;
use App\Enums\AnnouncementStatus;
use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Models\Announcement;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\Faq;
use App\Models\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_published_events(): void
    {
        $published = Event::factory()->create([
            'status' => EventStatus::PUBLISHED,
            'name' => 'Event Terbuka',
        ]);
        $draft = Event::factory()->create([
            'status' => EventStatus::DRAFT,
            'name' => 'Event Draf Rahasia',
        ]);

        $response = $this->getJson('/api/v1/events');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['name' => 'Event Terbuka'])
            ->assertJsonMissing(['name' => 'Event Draf Rahasia']);
    }

    public function test_can_fetch_event_detail_by_slug(): void
    {
        $event = Event::factory()->create([
            'slug' => 'it-event-2026',
            'status' => EventStatus::PUBLISHED,
        ]);

        $response = $this->getJson('/api/v1/events/it-event-2026');

        $response->assertOk()
            ->assertJsonPath('data.slug', 'it-event-2026');
    }

    public function test_can_fetch_categories_with_competitions_count(): void
    {
        $category = CompetitionCategory::factory()->create(['name' => 'Web Dev']);
        $event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);
        Competition::factory()->create([
            'category_id' => $category->id,
            'event_id' => $event->id,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        $response = $this->getJson('/api/v1/categories');

        $response->assertOk()
            ->assertJsonFragment(['name' => 'Web Dev', 'competitions_count' => 1]);
    }

    public function test_can_fetch_and_filter_competitions(): void
    {
        $category = CompetitionCategory::factory()->create(['slug' => 'ai-data']);
        $event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);

        $comp1 = Competition::factory()->create([
            'name' => 'Lomba AI Pintar',
            'category_id' => $category->id,
            'event_id' => $event->id,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);
        $comp2 = Competition::factory()->create([
            'name' => 'Lomba Web Rahasia',
            'status' => CompetitionStatus::DRAFT,
        ]);

        $response = $this->getJson('/api/v1/competitions?search=Pintar');

        $response->assertOk()
            ->assertJsonFragment(['name' => 'Lomba AI Pintar'])
            ->assertJsonMissing(['name' => 'Lomba Web Rahasia']);
    }

    public function test_can_fetch_competition_detail_by_slug(): void
    {
        $event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);
        $category = CompetitionCategory::factory()->create();
        $comp = Competition::factory()->create([
            'slug' => 'hackathon-2026',
            'event_id' => $event->id,
            'category_id' => $category->id,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        $response = $this->getJson('/api/v1/competitions/hackathon-2026');

        $response->assertOk()
            ->assertJsonPath('data.slug', 'hackathon-2026');
    }

    public function test_can_fetch_published_schedules(): void
    {
        $event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);
        Schedule::create([
            'event_id' => $event->id,
            'title' => 'Technical Meeting Akbar',
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHours(2),
            'location' => 'Zoom',
            'is_published' => true,
        ]);
        Schedule::create([
            'event_id' => $event->id,
            'title' => 'Rapat Tertutup Panitia',
            'start_at' => now()->addDay(),
            'end_at' => now()->addDay()->addHours(2),
            'location' => 'Internal Room',
            'is_published' => false,
        ]);

        $response = $this->getJson('/api/v1/schedules');

        $response->assertOk()
            ->assertJsonFragment(['title' => 'Technical Meeting Akbar'])
            ->assertJsonMissing(['title' => 'Rapat Tertutup Panitia']);
    }

    public function test_can_fetch_public_announcements(): void
    {
        $event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);
        Announcement::create([
            'event_id' => $event->id,
            'title' => 'Pengumuman Resmi Pendaftaran',
            'slug' => 'pengumuman-resmi-pendaftaran',
            'content' => 'Pendaftaran telah dibuka untuk umum.',
            'audience' => AnnouncementAudience::PUBLIC,
            'status' => AnnouncementStatus::PUBLISHED,
            'published_at' => now(),
        ]);
        Announcement::create([
            'event_id' => $event->id,
            'title' => 'Pengumuman Khusus Peserta',
            'slug' => 'pengumuman-khusus-peserta',
            'content' => 'Hanya untuk yang sudah lolos seleksi berkas.',
            'audience' => AnnouncementAudience::ALL_PARTICIPANTS,
            'status' => AnnouncementStatus::PUBLISHED,
            'published_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/announcements');

        $response->assertOk()
            ->assertJsonFragment(['title' => 'Pengumuman Resmi Pendaftaran'])
            ->assertJsonMissing(['title' => 'Pengumuman Khusus Peserta']);
    }

    public function test_can_fetch_faqs_and_filter_by_category(): void
    {
        Faq::create([
            'question' => 'Bagaimana cara mendaftar?',
            'answer' => 'Klik tombol Daftar.',
            'category' => 'Pendaftaran',
            'sort_order' => 1,
            'is_published' => true,
        ]);
        Faq::create([
            'question' => 'Pertanyaan tersembunyi',
            'answer' => 'Tidak terlihat',
            'category' => 'Internal',
            'sort_order' => 2,
            'is_published' => false,
        ]);

        $response = $this->getJson('/api/v1/faqs?category=Pendaftaran');

        $response->assertOk()
            ->assertJsonFragment(['question' => 'Bagaimana cara mendaftar?'])
            ->assertJsonMissing(['question' => 'Pertanyaan tersembunyi']);
    }

    public function test_can_fetch_public_statistics(): void
    {
        $event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);
        CompetitionCategory::factory()->create();
        Competition::factory()->create([
            'event_id' => $event->id,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        $response = $this->getJson('/api/v1/public/statistics');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'total_events',
                    'total_competitions',
                    'total_categories',
                    'total_registrations',
                    'total_participants',
                ],
            ]);
    }
}
