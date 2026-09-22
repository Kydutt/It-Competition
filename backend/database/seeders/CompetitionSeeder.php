<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\CompetitionTargetLevel;
use App\Enums\CompetitionType;
use App\Models\Competition;
use App\Models\JudgingCriteria;
use Illuminate\Database\Seeder;

class CompetitionSeeder extends Seeder
{
    public function run(): void
    {
        $competitions = [
            [
                'name' => 'UI/UX Competition',
                'slug' => 'ui-ux-competition',
                'competition_type' => CompetitionType::Team,
                'category' => CompetitionCategory::UiUx,
                'target_level' => CompetitionTargetLevel::University,
                'theme' => 'Inovasi Desain Solusi Digital untuk Kemajuan Ciayumajakuning',
                'description' => 'Kompetisi perancangan antarmuka dan pengalaman pengguna berbasis studi kasus nyata untuk mahasiswa aktif seluruh Indonesia.',
                'guidebook_url' => 'https://example.com/guidebook-uiux.pdf',
                'registration_fee' => 75000,
                'quota' => 50,
                'min_team_member' => 1,
                'max_team_member' => 3,
                'registration_start' => now()->subDays(5),
                'registration_end' => now()->addDays(20),
                'submission_start' => now()->addDays(1),
                'submission_deadline' => now()->addDays(25),
                'status' => CompetitionStatus::RegistrationOpen,
                'is_published' => true,
                'criteria' => [
                    ['name' => 'Problem Solving & User Research', 'weight' => 25.0, 'max_score' => 100],
                    ['name' => 'Visual Aesthetics & Consistency', 'weight' => 35.0, 'max_score' => 100],
                    ['name' => 'Usability, Flow & Prototyping', 'weight' => 25.0, 'max_score' => 100],
                    ['name' => 'Presentation & Pitch Pitching', 'weight' => 15.0, 'max_score' => 100],
                ],
            ],
            [
                'name' => 'Web Development Competition',
                'slug' => 'web-development-competition',
                'competition_type' => CompetitionType::Team,
                'category' => CompetitionCategory::WebDevelopment,
                'target_level' => CompetitionTargetLevel::University,
                'theme' => 'Akselerasi Transformasi Digital UMKM Lokal Berbasis Web Modern',
                'description' => 'Kompetisi rekayasa perangkat lunak berbasis website inovatif, responsif, berkinerja tinggi, dan scalable untuk mahasiswa.',
                'guidebook_url' => 'https://example.com/guidebook-webdev.pdf',
                'registration_fee' => 100000,
                'quota' => 40,
                'min_team_member' => 1,
                'max_team_member' => 3,
                'registration_start' => now()->subDays(5),
                'registration_end' => now()->addDays(20),
                'submission_start' => now()->addDays(1),
                'submission_deadline' => now()->addDays(25),
                'status' => CompetitionStatus::RegistrationOpen,
                'is_published' => true,
                'criteria' => [
                    ['name' => 'Kualitas Kode & Arsitektur Sistem', 'weight' => 30.0, 'max_score' => 100],
                    ['name' => 'Inovasi, Orisinalitas & Kelengkapan Fitur', 'weight' => 30.0, 'max_score' => 100],
                    ['name' => 'Responsivitas, Aksesibilitas & UI/UX', 'weight' => 20.0, 'max_score' => 100],
                    ['name' => 'Keamanan & Kecepatan Akses (Performance)', 'weight' => 20.0, 'max_score' => 100],
                ],
            ],
            [
                'name' => 'LKTI (Lomba Karya Tulis Ilmiah)',
                'slug' => 'lkti-competition',
                'competition_type' => CompetitionType::Team,
                'category' => CompetitionCategory::Lkti,
                'target_level' => CompetitionTargetLevel::HighSchool,
                'theme' => 'Peran Generasi Muda dalam Penerapan Green & Smart Technology',
                'description' => 'Kompetisi penulisan gagasan ilmiah solutif dan aplikatif bertema implementasi teknologi ramah lingkungan untuk siswa SMA/SMK/sederajat.',
                'guidebook_url' => 'https://example.com/guidebook-lkti.pdf',
                'registration_fee' => 50000,
                'quota' => 60,
                'min_team_member' => 2,
                'max_team_member' => 3,
                'registration_start' => now()->subDays(5),
                'registration_end' => now()->addDays(20),
                'submission_start' => now()->addDays(1),
                'submission_deadline' => now()->addDays(25),
                'status' => CompetitionStatus::RegistrationOpen,
                'is_published' => true,
                'criteria' => [
                    ['name' => 'Kesesuaian Tema & Orisinalitas Gagasan', 'weight' => 25.0, 'max_score' => 100],
                    ['name' => 'Kedalaman Kajian Pustaka & Metodologi', 'weight' => 30.0, 'max_score' => 100],
                    ['name' => 'Analisis, Pembahasan & Kelayakan Solusi', 'weight' => 30.0, 'max_score' => 100],
                    ['name' => 'Sistematika Penulisan & Kaidah Bahasa Ilmiah', 'weight' => 15.0, 'max_score' => 100],
                ],
            ],
            [
                'name' => 'Poster Competition',
                'slug' => 'poster-competition',
                'competition_type' => CompetitionType::Individual,
                'category' => CompetitionCategory::Poster,
                'target_level' => CompetitionTargetLevel::HighSchool,
                'theme' => 'Edukasi Keamanan Data Pribadi dan Etika Berselancar di Dunia Siber',
                'description' => 'Kompetisi desain poster digital kreatif yang menyuarakan kampanye literasi digital dan keamanan siber untuk siswa SMA/SMK/sederajat.',
                'guidebook_url' => 'https://example.com/guidebook-poster.pdf',
                'registration_fee' => 35000,
                'quota' => 100,
                'min_team_member' => 1,
                'max_team_member' => 1,
                'registration_start' => now()->subDays(5),
                'registration_end' => now()->addDays(20),
                'submission_start' => now()->addDays(1),
                'submission_deadline' => now()->addDays(25),
                'status' => CompetitionStatus::RegistrationOpen,
                'is_published' => true,
                'criteria' => [
                    ['name' => 'Orisinalitas Ide & Kreativitas Visual', 'weight' => 35.0, 'max_score' => 100],
                    ['name' => 'Kejelasan Pesan Edukasi & Komunikasi Visual', 'weight' => 35.0, 'max_score' => 100],
                    ['name' => 'Harmoni Warna, Tipografi & Komposisi Desain', 'weight' => 30.0, 'max_score' => 100],
                ],
            ],
            [
                'name' => 'AI Prompt Engineering Challenge (Draft)',
                'slug' => 'ai-prompt-challenge',
                'competition_type' => CompetitionType::Team,
                'category' => CompetitionCategory::WebDevelopment,
                'target_level' => CompetitionTargetLevel::University,
                'theme' => 'Eksplorasi Rekayasa Prompt Cerdas untuk Produktivitas',
                'description' => 'Kompetisi uji coba pembuatan instruksi model kecerdasan buatan untuk menyelesaikan masalah teknis.',
                'registration_fee' => 50000,
                'quota' => 30,
                'min_team_member' => 1,
                'max_team_member' => 2,
                'status' => CompetitionStatus::Draft,
                'is_published' => false,
                'criteria' => [],
            ],
        ];

        foreach ($competitions as $data) {
            $criteriaList = $data['criteria'];
            unset($data['criteria']);

            $competition = Competition::firstOrCreate(
                ['slug' => $data['slug']],
                $data
            );

            foreach ($criteriaList as $crit) {
                JudgingCriteria::firstOrCreate(
                    [
                        'competition_id' => $competition->id,
                        'name' => $crit['name'],
                    ],
                    $crit
                );
            }
        }
    }
}
