<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin account
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator HIMATIF',
                'password' => Hash::make('password123'),
                'role' => UserRole::Admin,
                'phone' => '081234567890',
                'institution' => 'HIMATIF Organization',
                'email_verified_at' => now(),
            ]
        );

        // 2. Judge account
        User::firstOrCreate(
            ['email' => 'judge@example.com'],
            [
                'name' => 'Dr. Tech Juri IT',
                'password' => Hash::make('password123'),
                'role' => UserRole::Judge,
                'phone' => '081234567891',
                'institution' => 'Dewan Juri Akademisi',
                'email_verified_at' => now(),
            ]
        );

        // 3. Participant account
        User::firstOrCreate(
            ['email' => 'participant@example.com'],
            [
                'name' => 'Arya Peserta IT',
                'password' => Hash::make('password123'),
                'role' => UserRole::Participant,
                'phone' => '081234567892',
                'institution' => 'Universitas Ciayumajakuning',
                'email_verified_at' => now(),
            ]
        );
    }
}
