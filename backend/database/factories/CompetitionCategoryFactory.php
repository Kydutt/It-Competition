<?php

namespace Database\Factories;

use App\Models\CompetitionCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CompetitionCategoryFactory extends Factory
{
    protected $model = CompetitionCategory::class;

    public function definition(): array
    {
        $name = fake()->unique()->word() . ' Competition';

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
        ];
    }
}
