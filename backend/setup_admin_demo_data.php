<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Enums\AnnouncementAudience;
use App\Enums\AnnouncementStatus;
use App\Enums\CompetitionStatus;
use App\Enums\DocumentVerificationStatus;
use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Enums\SubmissionStatus;
use App\Models\ActivityLog;
use App\Models\Announcement;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\Faq;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

$admin = User::firstOrCreate(
    ['email' => 'admin@itcomp.test'],
    [
        'name' => 'Administrator',
        'password' => Hash::make('Password123#'),
        'role' => Role::ADMIN,
        'is_active' => true,
    ]
);

$participant = User::firstOrCreate(
    ['email' => 'peserta@itcomp.test'],
    [
        'name' => 'Ahmad Fadhil',
        'password' => Hash::make('Password123#'),
        'role' => Role::PARTICIPANT,
        'is_active' => true,
    ]
);
$participant->profile()->firstOrCreate(
    ['user_id' => $participant->id],
    [
        'phone_number' => '081234567890',
        'institution' => 'Universitas Indonesia',
    ]
);

$event = Event::firstOrCreate(
    ['slug' => 'it-fest-2026'],
    [
        'name' => 'National IT Fest 2026',
        'theme' => 'Innovating with AI and Cloud for Nation Advancement',
        'description' => 'Perhelatan kompetisi teknologi informasi tingkat nasional tahun 2026.',
        'start_date' => '2026-10-01',
        'end_date' => '2026-10-15',
        'location' => 'Auditorium Kampus & Daring',
        'status' => EventStatus::PUBLISHED,
    ]
);

$cat1 = CompetitionCategory::firstOrCreate(
    ['slug' => 'software-development'],
    ['name' => 'Software Development', 'description' => 'Rekayasa aplikasi web dan mobile inovatif.']
);
$cat2 = CompetitionCategory::firstOrCreate(
    ['slug' => 'cyber-security'],
    ['name' => 'Cyber Security', 'description' => 'Capture the Flag dan keamanan siber.']
);
$cat3 = CompetitionCategory::firstOrCreate(
    ['slug' => 'ui-ux-design'],
    ['name' => 'UI/UX Design', 'description' => 'Desain pengalaman pengguna produk digital.']
);

$comp1 = Competition::firstOrCreate(
    ['slug' => 'competitive-programming-2026'],
    [
        'event_id' => $event->id,
        'category_id' => $cat1->id,
        'name' => 'Competitive Programming 2026',
        'short_description' => 'Adu algoritma dan pemecahan masalah komputasi terstruktur.',
        'description' => 'Kompetisi individu untuk menguji kemampuan logika, struktur data, dan efisiensi algoritma.',
        'registration_type' => RegistrationType::INDIVIDUAL,
        'min_members' => 1,
        'max_members' => 1,
        'registration_fee' => 0,
        'registration_start' => now()->subDays(5),
        'registration_deadline' => now()->addDays(25),
        'submission_deadline' => now()->addDays(35),
        'status' => CompetitionStatus::PUBLISHED,
    ]
);

$comp2 = Competition::firstOrCreate(
    ['slug' => 'web-development-challenge'],
    [
        'event_id' => $event->id,
        'category_id' => $cat1->id,
        'name' => 'Web Development Challenge',
        'short_description' => 'Pembangunan aplikasi web full-stack berskala enterprise.',
        'description' => 'Kompetisi beregu 2-3 orang dalam merancang solusi digital berbasis web.',
        'registration_type' => RegistrationType::TEAM,
        'min_members' => 2,
        'max_members' => 3,
        'registration_fee' => 0,
        'registration_start' => now()->subDays(5),
        'registration_deadline' => now()->addDays(20),
        'submission_deadline' => now()->addDays(30),
        'status' => CompetitionStatus::PUBLISHED,
    ]
);

// Registration 1 (Submitted)
$reg1 = Registration::firstOrCreate(
    ['registration_number' => 'ITC-2026-00001'],
    [
        'competition_id' => $comp1->id,
        'participant_id' => $participant->id,
        'status' => RegistrationStatus::SUBMITTED,
        'submitted_at' => now()->subHours(4),
    ]
);

RegistrationDocument::firstOrCreate(
    ['registration_id' => $reg1->id, 'document_type' => 'Kartu Tanda Mahasiswa'],
    [
        'file_path' => 'documents/ktm_ahmad.pdf',
        'original_filename' => 'ktm_ahmad.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 154200,
        'verification_status' => DocumentVerificationStatus::PENDING,
    ]
);

RegistrationDocument::firstOrCreate(
    ['registration_id' => $reg1->id, 'document_type' => 'Surat Keterangan Aktif'],
    [
        'file_path' => 'documents/surat_aktif.pdf',
        'original_filename' => 'surat_keterangan_aktif.pdf',
        'mime_type' => 'application/pdf',
        'file_size' => 204800,
        'verification_status' => DocumentVerificationStatus::VERIFIED,
        'verification_note' => 'Dokumen resmi berstempel basah.',
        'verified_by' => $admin->id,
        'verified_at' => now()->subHours(2),
    ]
);

// Registration 2 (Approved with Submission)
$reg2 = Registration::firstOrCreate(
    ['registration_number' => 'ITC-2026-00002'],
    [
        'competition_id' => $comp2->id,
        'participant_id' => $participant->id,
        'status' => RegistrationStatus::APPROVED,
        'submitted_at' => now()->subDays(2),
        'verified_at' => now()->subDays(1),
        'verified_by' => $admin->id,
        'admin_notes' => 'Berkas persyaratan lengkap dan memenuhi syarat.',
    ]
);

$sub1 = Submission::firstOrCreate(
    ['registration_id' => $reg2->id],
    [
        'title' => 'EduTech Hub - Platform Pembelajaran Interaktif Kampus',
        'description' => 'Aplikasi web pembelajaran adaptif berbasis kecerdasan buatan.',
        'repository_url' => 'https://github.com/itcomp/edutech-hub',
        'external_url' => 'https://edutech-hub.example.com',
        'status' => SubmissionStatus::SUBMITTED,
        'submitted_at' => now()->subHours(6),
    ]
);

// Announcements
Announcement::firstOrCreate(
    ['slug' => 'panduan-teknis-kompetisi-2026'],
    [
        'event_id' => $event->id,
        'title' => 'Panduan Teknis Pelaksanaan IT Fest 2026 Dirilis',
        'content' => 'Buku panduan resmi (rulebook) seluruh cabang lomba telah dapat diunduh pada halaman kompetisi.',
        'audience' => AnnouncementAudience::PUBLIC,
        'status' => AnnouncementStatus::PUBLISHED,
        'published_at' => now()->subDays(3),
    ]
);

// FAQ
Faq::firstOrCreate(
    ['question' => 'Apakah biaya registrasi dipungut untuk seluruh cabang kompetisi?'],
    [
        'answer' => 'Tidak. Seluruh pendaftaran kompetisi di IT Fest 2026 bebas biaya (gratis).',
        'category' => 'Pendaftaran',
        'sort_order' => 1,
        'is_published' => true,
    ]
);

// Activity Logs
ActivityLog::create([
    'user_id' => $admin->id,
    'action' => 'competition.publish',
    'entity_type' => 'Competition',
    'entity_id' => $comp1->id,
    'new_values' => ['name' => $comp1->name, 'status' => 'published'],
    'ip_address' => '127.0.0.1',
    'created_at' => now()->subHours(3),
]);

ActivityLog::create([
    'user_id' => $admin->id,
    'action' => 'registration.status_update',
    'entity_type' => 'Registration',
    'entity_id' => $reg2->id,
    'old_values' => ['status' => 'under_review'],
    'new_values' => ['status' => 'approved', 'note' => 'Berkas lengkap.'],
    'ip_address' => '127.0.0.1',
    'created_at' => now()->subDays(1),
]);

echo "Admin demo data setup completed successfully!" . PHP_EOL;
