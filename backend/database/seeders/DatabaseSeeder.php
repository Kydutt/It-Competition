<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Production seeders (Base categories and initial secure admin provisioning)
        $this->call([
            AdminUserSeeder::class,
            CompetitionCategorySeeder::class,
        ]);

        // Demo seeders run strictly in local, development, and testing environments
        if (app()->environment(['local', 'testing', 'development'])) {
            $this->call(DemoEventSeeder::class);
        }
    }
}
