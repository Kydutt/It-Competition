<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\RegistrationStatus;
use App\Enums\TeamMemberRole;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Seeder;

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

        // 1. Team: Syntax Squad (Web Dev) - Submitted
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

            Registration::firstOrCreate(
                ['competition_id' => $webDev->id, 'user_id' => $arya->id],
                [
                    'registration_number' => 'ITC-2026-00001',
                    'team_id' => $team1->id,
                    'status' => RegistrationStatus::Submitted,
                    'submitted_at' => now()->subDay(),
                ]
            );
        }

        // 2. Team: Pixel Craft (UI/UX) - Approved
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

            Registration::firstOrCreate(
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
        }

        // 3. Team: Smart Green Youth (LKTI) - Revision Required
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

            Registration::firstOrCreate(
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
        }

        // 4. Individual Registration: Poster Competition (Eka) - Draft
        if ($poster && $eka) {
            Registration::firstOrCreate(
                ['competition_id' => $poster->id, 'user_id' => $eka->id],
                [
                    'registration_number' => 'ITC-2026-00004',
                    'team_id' => null,
                    'status' => RegistrationStatus::Draft,
                ]
            );
        }
    }
}
