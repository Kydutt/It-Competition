<?php

namespace Database\Seeders;

use App\Enums\AnnouncementAudience;
use App\Enums\AnnouncementStatus;
use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\RegistrationType;
use App\Models\Announcement;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\Faq;
use App\Models\Schedule;
use Illuminate\Database\Seeder;

class DemoEventSeeder extends Seeder
{
    /**
     * Run demo event and competition seed data for development.
     */
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command?->warn('DemoEventSeeder is disabled in production environment.');
            return;
        }

        $event = Event::updateOrCreate(
            ['slug' => 'it-festival-2026'],
            [
                'name' => 'IT Festival 2026',
                'description' => 'Ajang kompetisi teknologi informasi tingkat nasional tahun 2026 yang mempertemukan talenta muda digital terbaik dari seluruh Indonesia.',
                'theme' => 'Innovating Through Technology for Sustainable Future',
                'start_date' => now()->addDays(5)->toDateString(),
                'end_date' => now()->addDays(45)->toDateString(),
                'location' => 'Jakarta Convention Center / Hybrid Online',
                'status' => EventStatus::PUBLISHED,
            ]
        );

        $webCategory = CompetitionCategory::where('slug', 'web-development')->first();
        $uiuxCategory = CompetitionCategory::where('slug', 'ui-ux-design')->first();
        $cpCategory = CompetitionCategory::where('slug', 'competitive-programming')->first();

        if ($webCategory) {
            Competition::updateOrCreate(
                ['slug' => 'web-development-competition-2026'],
                [
                    'event_id' => $event->id,
                    'category_id' => $webCategory->id,
                    'name' => 'Web Development Competition',
                    'short_description' => 'Bangun platform web interaktif dan berkinerja tinggi untuk memecahkan persoalan nyata masyarakat.',
                    'description' => "Kompetisi pengembangan aplikasi web modern yang menuntut inovasi, arsitektur scalable, dan pengalaman pengguna optimal. Peserta diminta merancang solusi digital ramah lingkungan dan inklusif.\n\nKriteria Penilaian:\n1. Relevansi & Inovasi Solusi (30%)\n2. Arsitektur & Kualitas Kode (25%)\n3. Desain UI/UX & Aksesibilitas (25%)\n4. Kesiapan Implementasi & Presentasi (20%)",
                    'eligibility' => 'Mahasiswa aktif D3/D4/S1 atau siswa SMA/SMK sederajat di seluruh Indonesia, dibuktikan dengan KTM/Kartu Pelajar aktif.',
                    'registration_type' => RegistrationType::TEAM,
                    'min_members' => 2,
                    'max_members' => 3,
                    'registration_fee' => 0.00,
                    'registration_start' => now()->subDays(5),
                    'registration_deadline' => now()->addDays(15),
                    'submission_deadline' => now()->addDays(25),
                    'status' => CompetitionStatus::REGISTRATION_OPEN,
                    'contact_information' => ['email' => 'webcomp@itcomp.test', 'whatsapp' => '081234567890'],
                ]
            );
        }

        if ($uiuxCategory) {
            Competition::updateOrCreate(
                ['slug' => 'ui-ux-design-challenge-2026'],
                [
                    'event_id' => $event->id,
                    'category_id' => $uiuxCategory->id,
                    'name' => 'UI/UX Design Challenge',
                    'short_description' => 'Rancang antarmuka produk digital yang estetis, fungsional, dan memberikan pengalaman terbaik bagi pengguna.',
                    'description' => "Tantangan desain produk digital yang berpusat pada pengguna (user-centered design). Peserta diharapkan menghasilkan prototype interaktif dengan dokumentasi design system yang komprehensif.\n\nKriteria Penilaian:\n1. User Research & Problem Framing (30%)\n2. Usability & Information Architecture (30%)\n3. Visual Design & Design System (25%)\n4. Prototype Interactivity (15%)",
                    'eligibility' => 'Mahasiswa aktif D3/D4/S1 atau siswa SMA/SMK sederajat di seluruh Indonesia.',
                    'registration_type' => RegistrationType::TEAM,
                    'min_members' => 2,
                    'max_members' => 3,
                    'registration_fee' => 0.00,
                    'registration_start' => now()->subDays(5),
                    'registration_deadline' => now()->addDays(15),
                    'submission_deadline' => now()->addDays(22),
                    'status' => CompetitionStatus::REGISTRATION_OPEN,
                    'contact_information' => ['email' => 'uiux@itcomp.test', 'whatsapp' => '081234567892'],
                ]
            );
        }

        if ($cpCategory) {
            Competition::updateOrCreate(
                ['slug' => 'competitive-programming-contest-2026'],
                [
                    'event_id' => $event->id,
                    'category_id' => $cpCategory->id,
                    'name' => 'Competitive Programming Contest',
                    'short_description' => 'Uji ketangkasan pemecahan masalah algoritma, efisiensi komputasi, dan struktur data.',
                    'description' => "Kompetisi pemrograman individu yang menguji kemampuan analisis matematis, pemahaman struktur data lanjut, dan perancangan algoritma cepat dalam batasan waktu dan memori ketat.\n\nAturan Teknis:\n- Bahasa yang didukung: C++, Java, Python 3\n- Sistem penilaian otomatis dengan batasan waktu 1-2 detik per problem.",
                    'eligibility' => 'Mahasiswa atau siswa aktif di seluruh Indonesia.',
                    'registration_type' => RegistrationType::INDIVIDUAL,
                    'min_members' => 1,
                    'max_members' => 1,
                    'registration_fee' => 0.00,
                    'registration_start' => now()->subDays(5),
                    'registration_deadline' => now()->addDays(15),
                    'submission_deadline' => null,
                    'status' => CompetitionStatus::REGISTRATION_OPEN,
                    'contact_information' => ['email' => 'cp@itcomp.test', 'whatsapp' => '081234567891'],
                ]
            );
        }

        // Demo Schedules (Timeline)
        $schedules = [
            [
                'title' => 'Pembukaan Pendaftaran Gelombang 1',
                'description' => 'Pendaftaran online resmi dibuka untuk seluruh cabang kompetisi.',
                'start_at' => now()->subDays(5)->setTime(8, 0),
                'end_at' => now()->addDays(15)->setTime(23, 59),
                'location' => 'Portal Resmi IT Comp',
                'meeting_url' => null,
            ],
            [
                'title' => 'Technical Meeting Seluruh Cabang',
                'description' => 'Pemaparan aturan lomba, kriteria penilaian, dan sesi tanya jawab teknis.',
                'start_at' => now()->addDays(16)->setTime(9, 0),
                'end_at' => now()->addDays(16)->setTime(12, 0),
                'location' => 'Online Video Conference',
                'meeting_url' => 'https://meet.itcomp.test/technical-meeting',
            ],
            [
                'title' => 'Batas Akhir Pengumpulan Karya',
                'description' => 'Pengunggahan berkas proposal, link repository, dan video demonstrasi melalui portal peserta.',
                'start_at' => now()->addDays(25)->setTime(23, 59),
                'end_at' => now()->addDays(25)->setTime(23, 59),
                'location' => 'Portal Peserta IT Comp',
                'meeting_url' => null,
            ],
            [
                'title' => 'Pengumuman Finalis & Awarding Ceremony',
                'description' => 'Pengumuman pemenang tiap cabang kompetisi dan penutupan acara resmi.',
                'start_at' => now()->addDays(35)->setTime(13, 0),
                'end_at' => now()->addDays(35)->setTime(17, 30),
                'location' => 'Auditorium JCC / Live Streaming YouTube',
                'meeting_url' => 'https://youtube.com/live/itcomp-awarding',
            ],
        ];

        foreach ($schedules as $item) {
            Schedule::updateOrCreate(
                ['event_id' => $event->id, 'title' => $item['title']],
                array_merge($item, ['is_published' => true])
            );
        }

        // Demo Announcements
        $announcements = [
            [
                'title' => 'Pendaftaran Resmi IT Festival 2026 Telah Dibuka!',
                'slug' => 'pendaftaran-resmi-it-festival-2026-dibuka',
                'content' => "<p>Halo Talenta Digital Indonesia!</p><p>Pendaftaran IT Festival 2026 kini telah resmi dibuka mulai tanggal <strong>hari ini</strong> hingga batas waktu yang ditentukan. Siapkan tim terbaikmu dan daftarkan diri pada kategori Web Development, UI/UX Design, atau Competitive Programming.</p><p>Pastikan kamu melengkapi data diri dan mengunggah kartu identitas pelajar/mahasiswa yang valid sebelum batas penutupan pendaftaran.</p>",
                'audience' => AnnouncementAudience::PUBLIC,
                'status' => AnnouncementStatus::PUBLISHED,
                'published_at' => now()->subDays(4),
            ],
            [
                'title' => 'Buku Panduan Teknis (Rulebook) Resmi Telah Dirilis',
                'slug' => 'buku-panduan-teknis-resmi-dirilis',
                'content' => "<p>Panitia pelaksana telah merilis Buku Panduan Teknis resmi untuk seluruh cabang perlombaan IT Festival 2026. Buku panduan mencakup format pengumpulan berkas, kriteria penilaian dewan juri, serta pedoman etika kompetisi.</p><p>Peserta disarankan membaca buku panduan secara seksama pada halaman detail masing-masing kompetisi.</p>",
                'audience' => AnnouncementAudience::PUBLIC,
                'status' => AnnouncementStatus::PUBLISHED,
                'published_at' => now()->subDays(2),
            ],
            [
                'title' => 'Jadwal Technical Meeting & Ketentuan Partisipasi',
                'slug' => 'jadwal-technical-meeting-dan-ketentuan',
                'content' => "<p>Technical Meeting akan dilaksanakan secara daring melalui platform video conference. Seluruh ketua tim dan peserta individu diwajibkan hadir untuk mendengarkan arahan teknis sistem submit karya serta aturan integritas akademis.</p><p>Tautan ruang virtual dapat diakses pada halaman Jadwal Acara.</p>",
                'audience' => AnnouncementAudience::PUBLIC,
                'status' => AnnouncementStatus::PUBLISHED,
                'published_at' => now()->subDay(),
            ],
        ];

        foreach ($announcements as $ann) {
            Announcement::updateOrCreate(
                ['slug' => $ann['slug']],
                array_merge($ann, ['event_id' => $event->id])
            );
        }

        // Demo FAQs
        $faqs = [
            [
                'question' => 'Siapa saja yang memenuhi syarat untuk mengikuti kompetisi?',
                'answer' => 'Kompetisi terbuka bagi siswa aktif tingkat SMA/SMK/MA sederajat dan mahasiswa aktif program diploma maupun sarjana (D3/D4/S1) di seluruh perguruan tinggi di Indonesia. Keaktifan dibuktikan dengan Kartu Pelajar atau Kartu Tanda Mahasiswa (KTM) yang masih berlaku.',
                'category' => 'Umum',
                'sort_order' => 1,
            ],
            [
                'question' => 'Apakah pendaftaran kompetisi dipungut biaya?',
                'answer' => 'Pendaftaran seluruh cabang kompetisi pada perhelatan IT Festival 2026 ini bersifat gratis (tidak dipungut biaya). Hati-hati terhadap segala bentuk penipuan yang mengatasnamakan panitia pelaksana.',
                'category' => 'Pendaftaran',
                'sort_order' => 2,
            ],
            [
                'question' => 'Berapa jumlah anggota dalam satu tim?',
                'answer' => 'Untuk kompetisi berbasis tim (seperti Web Development dan UI/UX Design), satu tim terdiri dari minimal 2 orang dan maksimal 3 orang anggota, di mana salah satu anggota bertindak sebagai Ketua Tim. Untuk Competitive Programming, kompetisi bersifat individu (1 orang).',
                'category' => 'Kompetisi',
                'sort_order' => 3,
            ],
            [
                'question' => 'Apakah satu orang boleh mendaftar lebih dari satu cabang kompetisi?',
                'answer' => 'Satu orang peserta hanya diperbolehkan terdaftar pada satu cabang kompetisi di dalam event yang sama guna menjaga fokus dan komitmen penyelesaian karya.',
                'category' => 'Pendaftaran',
                'sort_order' => 4,
            ],
            [
                'question' => 'Bagaimana alur pengumpulan karya (submission)?',
                'answer' => 'Setelah registrasi diverifikasi oleh panitia dan fase pengumpulan karya dibuka, peserta dapat mengunggah berkas proposal (PDF), tautan repository (GitHub/GitLab), tautan demo aplikasi, atau prototype Figma melalui halaman portal peserta sebelum batas waktu pengumpulan berakhir.',
                'category' => 'Teknis',
                'sort_order' => 5,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(
                ['question' => $faq['question']],
                array_merge($faq, ['is_published' => true])
            );
        }
    }
}
