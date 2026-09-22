<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\Faq;
use App\Models\Sponsor;
use Illuminate\Database\Seeder;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        // FAQs
        $faqs = [
            [
                'question' => 'Siapa saja yang boleh mengikuti HIMATIF IT Competition?',
                'answer' => 'Kompetisi terbuka untuk seluruh mahasiswa aktif perguruan tinggi dan siswa/i aktif SMA/SMK/sederajat di wilayah Ciayumajakuning (Cirebon, Indramayu, Majalengka, Kuningan).',
                'category' => 'general',
                'order' => 1,
            ],
            [
                'question' => 'Apakah satu tim boleh beranggotakan dari institusi yang berbeda?',
                'answer' => 'Seluruh anggota dalam satu tim wajib berasal dari sekolah atau perguruan tinggi yang sama.',
                'category' => 'registration',
                'order' => 2,
            ],
            [
                'question' => 'Bagaimana alur pembayaran pendaftaran?',
                'answer' => 'Pembayaran dilakukan setelah ketua tim mendaftarkan tim pada kategori lomba yang dipilih, lalu upload bukti transfer pada dashboard peserta.',
                'category' => 'payment',
                'order' => 3,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::firstOrCreate(['question' => $faq['question']], $faq);
        }

        // Announcements
        $announcements = [
            [
                'title' => 'Pendaftaran HIMATIF IT Competition Resmi Dibuka!',
                'slug' => 'pendaftaran-himatif-it-competition-resmi-dibuka',
                'content' => 'Halo calon innovator muda Ciayumajakuning! Pendaftaran untuk 4 cabang kompetisi resmi dibuka mulai hari ini. Segera bentuk tim terbaik kalian dan submit karya terbaik!',
                'is_published' => true,
                'published_at' => now(),
            ],
            [
                'title' => 'Panduan & Rulebook Kompetisi Dapat Diunduh',
                'slug' => 'panduan-dan-rulebook-kompetisi-dapat-diunduh',
                'content' => 'Buku panduan teknis untuk UI/UX, Web Development, LKTI, dan Poster sudah dapat diunduh pada masing-masing halaman detail lomba.',
                'is_published' => true,
                'published_at' => now(),
            ],
        ];

        foreach ($announcements as $announcement) {
            Announcement::firstOrCreate(['slug' => $announcement['slug']], $announcement);
        }

        // Sponsors
        $sponsors = [
            [
                'name' => 'PT Teknologi Solusi Nusantara',
                'logo_url' => 'https://placehold.co/200x80?text=TechSolusi',
                'tier' => 'platinum',
                'website_url' => 'https://example.com',
                'order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Cloud Provider Indonesia',
                'logo_url' => 'https://placehold.co/200x80?text=CloudID',
                'tier' => 'gold',
                'website_url' => 'https://example.com',
                'order' => 2,
                'is_active' => true,
            ],
        ];

        foreach ($sponsors as $sponsor) {
            Sponsor::firstOrCreate(['name' => $sponsor['name']], $sponsor);
        }
    }
}
