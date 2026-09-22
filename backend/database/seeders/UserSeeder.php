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

        // 3. Participant accounts
        User::firstOrCreate(
            ['email' => 'participant@example.com'],
            [
                'name' => 'Arya Peserta IT',
                'password' => Hash::make('password123'),
                'role' => UserRole::Participant,
                'phone' => '081234567892',
                'institution' => 'Universitas Swadaya Gunung Jati',
                'education_level' => 'university',
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'budi@example.com'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('password123'),
                'role' => UserRole::Participant,
                'phone' => '081234567893',
                'institution' => 'Universitas Swadaya Gunung Jati',
                'education_level' => 'university',
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'citra@example.com'],
            [
                'name' => 'Citra Lestari',
                'password' => Hash::make('password123'),
                'role' => UserRole::Participant,
                'phone' => '081234567894',
                'institution' => 'Politeknik Negeri Indramayu',
                'education_level' => 'university',
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'dewi@example.com'],
            [
                'name' => 'Dewi Safitri',
                'password' => Hash::make('password123'),
                'role' => UserRole::Participant,
                'phone' => '081234567895',
                'institution' => 'SMAN 1 Cirebon',
                'education_level' => 'high_school',
                'email_verified_at' => now(),
            ]
        );

        User::firstOrCreate(
            ['email' => 'eka@example.com'],
            [
                'name' => 'Eka Pratama',
                'password' => Hash::make('password123'),
                'role' => UserRole::Participant,
                'phone' => '081234567896',
                'institution' => 'SMK Negeri 1 Kuningan',
                'education_level' => 'high_school',
                'email_verified_at' => now(),
            ]
        );
    }
}
