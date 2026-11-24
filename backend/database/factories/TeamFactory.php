<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TeamFactory extends Factory
{
    protected $model = Team::class;

    public function definition(): array
    {
        return [
            'name' => 'Team ' . fake()->unique()->lastName(),
            'team_code' => 'TM-' . strtoupper(Str::random(6)),
            'leader_id' => User::factory(),
        ];
    }
}
