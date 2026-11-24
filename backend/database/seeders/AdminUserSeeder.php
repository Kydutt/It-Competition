<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Note: Uses environment variables for credentials. Does not hardcode static secrets.
     */
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@itcomp.test');
        $name = env('ADMIN_NAME', 'System Administrator');
        $envPassword = env('ADMIN_PASSWORD');

        $isGenerated = empty($envPassword);
        $password = $envPassword ?: Str::random(16);

        $admin = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'role' => Role::ADMIN,
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info("Admin user created/updated: {$admin->email}");

        if ($isGenerated) {
            $this->command->warn("ADMIN_PASSWORD was not set in .env. A temporary password was generated: {$password}");
        }
    }
}
