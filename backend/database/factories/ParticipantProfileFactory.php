<?php

namespace Database\Factories;

use App\Models\ParticipantProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ParticipantProfileFactory extends Factory
{
    protected $model = ParticipantProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'phone' => '081' . fake()->numerify('########'),
            'institution' => 'Universitas ' . fake()->city(),
            'education_level' => 'S1 / Sarjana',
            'identity_number' => fake()->numerify('################'),
            'address' => fake()->address(),
            'profile_photo_path' => null,
        ];
    }
}
