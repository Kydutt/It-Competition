<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Enums\Role;
use App\Enums\RegistrationStatus;
use App\Enums\SubmissionStatus;
use App\Models\User;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\Submission;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

// 1. Inactive Participant
$inactive = User::updateOrCreate(
    ['email' => 'inactive_user@itcomp.test'],
    [
        'name' => 'Akun Dinonaktifkan',
        'password' => Hash::make('Password123#'),
        'role' => Role::PARTICIPANT,
        'is_active' => false,
        'email_verified_at' => now(),
    ]
);
echo "Created/Updated Inactive Participant: {$inactive->email}\n";

// 2. Admin User
$admin = User::updateOrCreate(
    ['email' => 'admin_e2e@itcomp.test'],
    [
        'name' => 'Admin E2E Tester',
        'password' => Hash::make('Password123#'),
        'role' => Role::ADMIN,
        'is_active' => true,
        'email_verified_at' => now(),
    ]
);
echo "Created/Updated Admin User: {$admin->email}\n";

// 3. User with Revision Required
$revUser = User::updateOrCreate(
    ['email' => 'peserta_revisi@itcomp.test'],
    [
        'name' => 'Peserta Uji Revisi',
        'password' => Hash::make('Password123#'),
        'role' => Role::PARTICIPANT,
        'is_active' => true,
        'email_verified_at' => now(),
    ]
);

$comp = Competition::where('status', 'registration_open')->first();
if ($comp) {
    $reg = Registration::updateOrCreate(
        ['participant_id' => $revUser->id, 'competition_id' => $comp->id],
        [
            'registration_number' => 'ITC-2026-REV01',
            'status' => RegistrationStatus::APPROVED,
            'submitted_at' => now()->subDays(3),
            'verified_at' => now()->subDay(),
        ]
    );

    $sub = Submission::updateOrCreate(
        ['registration_id' => $reg->id],
        [
            'submitted_by' => $revUser->id,
            'title' => 'Karya Perlu Perbaikan',
            'description' => 'Aplikasi web v1.0',
            'status' => SubmissionStatus::REVISION_REQUIRED,
            'review_note' => 'Mohon sertakan diagram arsitektur sistem dan link demo yang dapat diakses.',
            'submitted_at' => now()->subDays(2),
        ]
    );
    echo "Created/Updated Registration & Submission in REVISION_REQUIRED for {$revUser->email}\n";
}

// 4. Other Participant's Registration
$otherUser = User::updateOrCreate(
    ['email' => 'other_owner@itcomp.test'],
    [
        'name' => 'Pemilik Pendaftaran Lain',
        'password' => Hash::make('Password123#'),
        'role' => Role::PARTICIPANT,
        'is_active' => true,
        'email_verified_at' => now(),
    ]
);

if ($comp) {
    $otherReg = Registration::updateOrCreate(
        ['participant_id' => $otherUser->id, 'competition_id' => $comp->id],
        [
            'registration_number' => 'ITC-2026-OTHER99',
            'status' => RegistrationStatus::SUBMITTED,
            'submitted_at' => now()->subDays(1),
        ]
    );
    echo "Created/Updated Other Participant's Registration ID {$otherReg->id}\n";
}

echo "Setup completed successfully.\n";
