<?php

namespace Database\Seeders;

use App\Models\CompetitionCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CompetitionCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Web Development',
                'description' => 'Kompetisi pengembangan aplikasi berbasis web inovatif dan responsif.',
            ],
            [
                'name' => 'UI/UX Design',
                'description' => 'Kompetisi perancangan antarmuka dan pengalaman pengguna solusi digital.',
            ],
            [
                'name' => 'Competitive Programming',
                'description' => 'Kompetisi pemecahan masalah algoritma dan struktur data berkecepatan tinggi.',
            ],
            [
                'name' => 'Cyber Security',
                'description' => 'Kompetisi keamanan siber, analisis celah keamanan, dan Capture The Flag (CTF).',
            ],
            [
                'name' => 'Mobile App Development',
                'description' => 'Kompetisi pembuatan aplikasi mobile native maupun cross-platform berdaya guna tinggi.',
            ],
        ];

        foreach ($categories as $cat) {
            CompetitionCategory::updateOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                ]
            );
        }
    }
}
