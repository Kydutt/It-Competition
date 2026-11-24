<?php

namespace Database\Factories;

use App\Enums\RegistrationStatus;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RegistrationFactory extends Factory
{
    protected $model = Registration::class;

    public function definition(): array
    {
        return [
            'registration_number' => 'ITC-' . date('Y') . '-' . fake()->unique()->numerify('#####'),
            'competition_id' => Competition::factory(),
            'participant_id' => User::factory(),
            'team_id' => null,
            'status' => RegistrationStatus::DRAFT,
            'notes' => fake()->sentence(),
            'admin_notes' => null,
            'submitted_at' => null,
            'verified_at' => null,
            'verified_by' => null,
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn () => [
            'status' => RegistrationStatus::SUBMITTED,
            'submitted_at' => now(),
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => RegistrationStatus::APPROVED,
            'submitted_at' => now()->subDays(2),
            'verified_at' => now(),
            'verified_by' => User::factory()->admin(),
        ]);
    }
}
