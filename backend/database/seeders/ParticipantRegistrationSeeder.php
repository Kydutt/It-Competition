<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Enums\SubmissionStatus;
use App\Enums\TeamMemberRole;
use App\Models\Competition;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\SubmissionFile;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class ParticipantRegistrationSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@example.com')->first();
        $arya = User::where('email', 'participant@example.com')->first();
        $budi = User::where('email', 'budi@example.com')->first();
        $citra = User::where('email', 'citra@example.com')->first();
        $dewi = User::where('email', 'dewi@example.com')->first();
        $eka = User::where('email', 'eka@example.com')->first();

        $webDev = Competition::where('slug', 'web-development-competition')->first();
        $uiux = Competition::where('slug', 'ui-ux-competition')->first();
        $lkti = Competition::where('slug', 'lkti-competition')->first();
        $poster = Competition::where('slug', 'poster-competition')->first();

        if (! $arya || ! $webDev) {
            return;
        }

        // 1. Team: Syntax Squad (Web Dev) - Submitted Registration, Payment Under Review
        if ($webDev && $arya && $budi) {
            $team1 = Team::firstOrCreate(
                ['competition_id' => $webDev->id, 'name' => 'Syntax Squad'],
                [
                    'leader_id' => $arya->id,
                    'code' => 'HITC-WEB01',
                    'institution' => 'Universitas Swadaya Gunung Jati',
                ]
            );

            TeamMember::firstOrCreate(
                ['team_id' => $team1->id, 'user_id' => $arya->id],
                ['role' => TeamMemberRole::Leader, 'joined_at' => now()->subDays(2)]
            );
            TeamMember::firstOrCreate(
                ['team_id' => $team1->id, 'user_id' => $budi->id],
                ['role' => TeamMemberRole::Member, 'joined_at' => now()->subDays(1)]
            );

            $reg1 = Registration::firstOrCreate(
                ['competition_id' => $webDev->id, 'user_id' => $arya->id],
                [
                    'registration_number' => 'ITC-2026-00001',
                    'team_id' => $team1->id,
                    'status' => RegistrationStatus::Submitted,
                    'submitted_at' => now()->subDay(),
                ]
            );

            // Sample private payment proof file
            $proofPath1 = "payments/{$reg1->id}/1/proof_sample_arya.jpg";
            Storage::disk('local')->put($proofPath1, 'Sample Payment Proof Content');

            Payment::firstOrCreate(
                ['registration_id' => $reg1->id],
                [
                    'user_id' => $arya->id,
                    'amount' => (int) $webDev->registration_fee,
                    'payment_method' => 'bank_transfer',
                    'status' => PaymentStatus::UnderReview,
                    'proof_path' => $proofPath1,
                    'submitted_at' => now()->subHours(10),
                ]
            );
        }

        // 2. Team: Pixel Craft (UI/UX) - Approved Registration, Approved Payment, Submitted Work
        if ($uiux && $citra) {
            $team2 = Team::firstOrCreate(
                ['competition_id' => $uiux->id, 'name' => 'Pixel Craft'],
                [
                    'leader_id' => $citra->id,
                    'code' => 'HITC-UIX02',
                    'institution' => 'Politeknik Negeri Indramayu',
                ]
            );

            TeamMember::firstOrCreate(
                ['team_id' => $team2->id, 'user_id' => $citra->id],
                ['role' => TeamMemberRole::Leader, 'joined_at' => now()->subDays(3)]
            );

            $reg2 = Registration::firstOrCreate(
                ['competition_id' => $uiux->id, 'user_id' => $citra->id],
                [
                    'registration_number' => 'ITC-2026-00002',
                    'team_id' => $team2->id,
                    'status' => RegistrationStatus::Approved,
                    'submitted_at' => now()->subDays(2),
                    'reviewed_at' => now()->subDay(),
                    'reviewed_by' => $admin?->id,
                ]
            );

            // Approved Payment
            $proofPath2 = "payments/{$reg2->id}/2/proof_sample_citra.png";
            Storage::disk('local')->put($proofPath2, 'Sample Payment Proof Content 2');

            Payment::firstOrCreate(
                ['registration_id' => $reg2->id],
                [
                    'user_id' => $citra->id,
                    'amount' => (int) $uiux->registration_fee,
                    'payment_method' => 'bank_transfer',
                    'status' => PaymentStatus::Approved,
                    'proof_path' => $proofPath2,
                    'submitted_at' => now()->subDays(2),
                    'reviewed_at' => now()->subDay(),
                    'reviewed_by' => $admin?->id,
                ]
            );

            // Submitted Work with files
            $sub2 = Submission::firstOrCreate(
                ['registration_id' => $reg2->id],
                [
                    'competition_id' => $uiux->id,
                    'team_id' => $team2->id,
                    'title' => 'Inovasi Aplikasi Edukasi Sampah Cirebon (Ecoflow)',
                    'description' => 'Aplikasi mobile penukaran poin pilah sampah berbasis gamifikasi untuk warga Ciayumajakuning.',
                    'status' => SubmissionStatus::Submitted,
                    'submitted_at' => now()->subHours(8),
                ]
            );

            $filePath1 = "submissions/{$reg2->id}/{$sub2->id}/proposal_ecoflow.pdf";
            Storage::disk('local')->put($filePath1, 'Sample Proposal Content');

            SubmissionFile::firstOrCreate(
                ['submission_id' => $sub2->id, 'stored_name' => 'proposal_ecoflow.pdf'],
                [
                    'original_name' => 'Proposal_PixelCraft_Ecoflow_UIUX.pdf',
                    'mime_type' => 'application/pdf',
                    'size' => 2450000,
                    'path' => $filePath1,
                ]
            );

            $filePath2 = "submissions/{$reg2->id}/{$sub2->id}/figma_screens.png";
            Storage::disk('local')->put($filePath2, 'Sample Prototype Image Content');

            SubmissionFile::firstOrCreate(
                ['submission_id' => $sub2->id, 'stored_name' => 'figma_screens.png'],
                [
                    'original_name' => 'HighFidelity_Prototype_Screens.png',
                    'mime_type' => 'image/png',
                    'size' => 1850000,
                    'path' => $filePath2,
                ]
            );
        }

        // 3. Team: Smart Green Youth (LKTI) - Revision Required Registration, Rejected Payment
        if ($lkti && $dewi && $eka) {
            $team3 = Team::firstOrCreate(
                ['competition_id' => $lkti->id, 'name' => 'Smart Green Youth'],
                [
                    'leader_id' => $dewi->id,
                    'code' => 'HITC-LKT03',
                    'institution' => 'SMAN 1 Cirebon',
                ]
            );

            TeamMember::firstOrCreate(
                ['team_id' => $team3->id, 'user_id' => $dewi->id],
                ['role' => TeamMemberRole::Leader, 'joined_at' => now()->subDays(3)]
            );
            TeamMember::firstOrCreate(
                ['team_id' => $team3->id, 'user_id' => $eka->id],
                ['role' => TeamMemberRole::Member, 'joined_at' => now()->subDays(2)]
            );

            $reg3 = Registration::firstOrCreate(
                ['competition_id' => $lkti->id, 'user_id' => $dewi->id],
                [
                    'registration_number' => 'ITC-2026-00003',
                    'team_id' => $team3->id,
                    'status' => RegistrationStatus::RevisionRequired,
                    'submitted_at' => now()->subDays(2),
                    'reviewed_at' => now()->subHours(12),
                    'reviewed_by' => $admin?->id,
                    'revision_note' => 'Mohon lengkapi surat rekomendasi dari sekolah dan perjelas abstrak karya tulis.',
                ]
            );

            $proofPath3 = "payments/{$reg3->id}/3/proof_sample_dewi.jpg";
            Storage::disk('local')->put($proofPath3, 'Sample Payment Proof Content 3');

            Payment::firstOrCreate(
                ['registration_id' => $reg3->id],
                [
                    'user_id' => $dewi->id,
                    'amount' => (int) $lkti->registration_fee,
                    'payment_method' => 'bank_transfer',
                    'status' => PaymentStatus::Rejected,
                    'proof_path' => $proofPath3,
                    'rejection_reason' => 'Bukti transfer buram dan tidak terbaca nominalnya. Harap unggah ulang.',
                    'submitted_at' => now()->subDays(1),
                    'reviewed_at' => now()->subHours(6),
                    'reviewed_by' => $admin?->id,
                ]
            );
        }

        // 4. Individual Registration: Poster Competition (Eka) - Approved Registration, Free Competition (0 fee)
        // Demonstrates automatic payment bypass and direct submission draft
        if ($poster && $eka) {
            $reg4 = Registration::firstOrCreate(
                ['competition_id' => $poster->id, 'user_id' => $eka->id],
                [
                    'registration_number' => 'ITC-2026-00004',
                    'team_id' => null,
                    'status' => RegistrationStatus::Approved,
                    'submitted_at' => now()->subDays(2),
                    'reviewed_at' => now()->subDay(),
                    'reviewed_by' => $admin?->id,
                ]
            );

            // Directly creates draft submission without payment!
            Submission::firstOrCreate(
                ['registration_id' => $reg4->id],
                [
                    'competition_id' => $poster->id,
                    'team_id' => null,
                    'title' => 'Poster Kampanye Stop Cyberbullying Siswa',
                    'description' => 'Poster edukasi grafis digital pencegahan perundungan siber di lingkungan sekolah.',
                    'status' => SubmissionStatus::Draft,
                ]
            );
        }
    }
}
