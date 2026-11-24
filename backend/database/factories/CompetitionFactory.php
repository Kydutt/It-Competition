<?php

namespace Database\Factories;

use App\Enums\CompetitionStatus;
use App\Enums\RegistrationType;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CompetitionFactory extends Factory
{
    protected $model = Competition::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(2, true) . ' Championship';

        return [
            'event_id' => Event::factory(),
            'category_id' => CompetitionCategory::factory(),
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'short_description' => fake()->sentence(),
            'description' => fake()->paragraphs(2, true),
            'cover_image_path' => null,
            'eligibility' => 'Mahasiswa / Siswa SMA/SMK aktif',
            'registration_type' => RegistrationType::INDIVIDUAL,
            'min_members' => 1,
            'max_members' => 1,
            'registration_fee' => 0.00,
            'registration_start' => now()->subDays(5),
            'registration_deadline' => now()->addDays(20),
            'submission_deadline' => now()->addDays(30),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
            'guidebook_path' => null,
            'contact_information' => ['email' => 'panitia@example.com', 'whatsapp' => '081234567890'],
        ];
    }

    public function team(int $min = 2, int $max = 3): static
    {
        return $this->state(fn () => [
            'registration_type' => RegistrationType::TEAM,
            'min_members' => $min,
            'max_members' => $max,
        ]);
    }
}
