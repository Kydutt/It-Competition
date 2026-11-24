<?php

namespace Tests\Feature;

use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Enums\SubmissionStatus;
use App\Models\Competition;
use App\Models\Event;
use App\Models\Notification;
use App\Models\Registration;
use App\Models\RegistrationDocument;
use App\Models\Submission;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ParticipantSecurityAndAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $participantA;
    protected User $participantB;
    protected User $adminUser;
    protected User $inactiveUser;
    protected Competition $indivComp;
    protected Competition $teamComp;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Storage::fake('local');

        $this->participantA = User::factory()->create([
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        $this->participantB = User::factory()->create([
            'role' => Role::PARTICIPANT,
            'is_active' => true,
        ]);

        $this->adminUser = User::factory()->create([
            'role' => Role::ADMIN,
            'is_active' => true,
        ]);

        $this->inactiveUser = User::factory()->create([
            'role' => Role::PARTICIPANT,
            'is_active' => false,
        ]);

        $event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);

        $this->indivComp = Competition::factory()->create([
            'event_id' => $event->id,
            'registration_type' => RegistrationType::INDIVIDUAL,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
            'registration_start' => now()->subDays(2),
            'registration_deadline' => now()->addDays(10),
            'submission_deadline' => now()->addDays(20),
        ]);

        $this->teamComp = Competition::factory()->create([
            'event_id' => $event->id,
            'registration_type' => RegistrationType::TEAM,
            'min_members' => 2,
            'max_members' => 3,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
            'registration_start' => now()->subDays(2),
            'registration_deadline' => now()->addDays(10),
            'submission_deadline' => now()->addDays(20),
        ]);
    }

    /**
     * 1. Peserta tidak dapat melihat atau mengubah profil peserta lain.
     */
    public function test_participant_cannot_view_or_modify_other_participant_profile(): void
    {
        $resA = $this->actingAs($this->participantA)->getJson('/api/v1/participant/profile');
        $resA->assertOk()->assertJsonPath('data.email', $this->participantA->email);

        $this->actingAs($this->participantA)->putJson('/api/v1/participant/profile', [
            'name' => 'Nama Baru A',
        ])->assertOk()->assertJsonPath('data.name', 'Nama Baru A');

        $this->assertDatabaseHas('users', ['id' => $this->participantA->id, 'name' => 'Nama Baru A']);
        $this->assertDatabaseMissing('users', ['id' => $this->participantB->id, 'name' => 'Nama Baru A']);
    }

    /**
     * 2. Peserta tidak dapat mengakses tim milik peserta lain.
     */
    public function test_participant_cannot_access_other_participant_team(): void
    {
        $teamA = Team::create([
            'leader_id' => $this->participantA->id,
            'name' => 'Team Alpha',
            'team_code' => 'ALPHA1',
        ]);
        $teamA->members()->attach($this->participantA->id, ['member_role' => 'leader', 'joined_at' => now()]);

        $res = $this->actingAs($this->participantB)->getJson("/api/v1/participant/teams/{$teamA->id}");
        $res->assertForbidden();

        $updateRes = $this->actingAs($this->participantB)->putJson("/api/v1/participant/teams/{$teamA->id}", [
            'name' => 'Hacked Name',
        ]);
        $updateRes->assertForbidden();
    }

    /**
     * 3. Peserta tidak dapat mengubah anggota tim yang bukan miliknya.
     */
    public function test_participant_cannot_modify_members_of_other_team(): void
    {
        $teamA = Team::create([
            'leader_id' => $this->participantA->id,
            'name' => 'Team Alpha 2',
            'team_code' => 'ALPHA2',
        ]);
        $teamA->members()->attach($this->participantA->id, ['member_role' => 'leader', 'joined_at' => now()]);

        $thirdUser = User::factory()->create(['role' => Role::PARTICIPANT]);

        $addRes = $this->actingAs($this->participantB)->postJson("/api/v1/participant/teams/{$teamA->id}/members", [
            'email' => $thirdUser->email,
        ]);
        $addRes->assertForbidden();

        $removeRes = $this->actingAs($this->participantB)->deleteJson("/api/v1/participant/teams/{$teamA->id}/members/{$this->participantA->id}");
        $removeRes->assertForbidden();
    }

    /**
     * 4. Peserta tidak dapat melihat pendaftaran milik peserta lain.
     */
    public function test_participant_cannot_view_or_update_other_registration(): void
    {
        $regA = Registration::factory()->create([
            'participant_id' => $this->participantA->id,
            'competition_id' => $this->indivComp->id,
            'status' => RegistrationStatus::DRAFT,
        ]);

        $viewRes = $this->actingAs($this->participantB)->getJson("/api/v1/participant/registrations/{$regA->id}");
        $viewRes->assertForbidden();

        $updateRes = $this->actingAs($this->participantB)->putJson("/api/v1/participant/registrations/{$regA->id}", [
            'notes' => 'Catatan penyusup',
        ]);
        $updateRes->assertForbidden();

        $submitRes = $this->actingAs($this->participantB)->postJson("/api/v1/participant/registrations/{$regA->id}/submit");
        $submitRes->assertForbidden();

        $uploadRes = $this->actingAs($this->participantB)->postJson("/api/v1/participant/registrations/{$regA->id}/documents", [
            'document_type' => 'ktm',
            'file' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ]);
        $uploadRes->assertForbidden();
    }

    /**
     * 5. Peserta tidak dapat mengunduh dokumen pendaftaran milik peserta lain.
     */
    public function test_participant_cannot_download_other_participant_document(): void
    {
        $regA = Registration::factory()->create([
            'participant_id' => $this->participantA->id,
            'competition_id' => $this->indivComp->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        $docPath = 'private/documents/' . $regA->id . '/test_identitas.pdf';
        Storage::put($docPath, 'ISI_DOKUMEN_RAHASIA');

        $doc = RegistrationDocument::create([
            'registration_id' => $regA->id,
            'uploaded_by' => $this->participantA->id,
            'document_type' => 'ktm',
            'original_filename' => 'ktm_asli.pdf',
            'file_path' => $docPath,
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'verification_status' => 'pending',
        ]);

        // Participant B mencoba mengunduh dokumen A -> 403
        $unauthDownload = $this->actingAs($this->participantB)->get("/api/v1/participant/documents/{$doc->id}/download");
        $unauthDownload->assertForbidden();

        // Participant A (pemilik) dapat mengunduh -> 200
        $authDownload = $this->actingAs($this->participantA)->get("/api/v1/participant/documents/{$doc->id}/download");
        $authDownload->assertOk();
    }

    /**
     * 6. Peserta tidak dapat membaca atau mengubah notifikasi peserta lain.
     */
    public function test_participant_cannot_access_or_modify_other_participant_notifications(): void
    {
        $notifA = Notification::create([
            'user_id' => $this->participantA->id,
            'title' => 'Pesan Rahasia A',
            'message' => 'Status pendaftaran A telah diverifikasi.',
            'type' => 'registration_status',
        ]);

        // Participant B list notif tidak melihat notif A
        $listRes = $this->actingAs($this->participantB)->getJson('/api/v1/participant/notifications');
        $listRes->assertOk()->assertJsonMissing(['title' => 'Pesan Rahasia A']);

        // Participant B mencoba markAsRead notif A -> 404
        $readRes = $this->actingAs($this->participantB)->patchJson("/api/v1/participant/notifications/{$notifA->id}/read");
        $readRes->assertNotFound();
    }

    /**
     * 7. Pengguna dengan role admin tidak dapat mengakses endpoint khusus peserta tanpa otorisasi yang sesuai.
     */
    public function test_admin_cannot_access_participant_portal_endpoints(): void
    {
        $res = $this->actingAs($this->adminUser)->getJson('/api/v1/participant/dashboard');
        $res->assertForbidden();

        $resReg = $this->actingAs($this->adminUser)->getJson('/api/v1/participant/registrations');
        $resReg->assertForbidden();
    }

    /**
     * 8. Akun nonaktif tidak dapat menggunakan portal peserta.
     */
    public function test_inactive_participant_cannot_access_portal(): void
    {
        $res = $this->actingAs($this->inactiveUser)->getJson('/api/v1/participant/dashboard');
        $res->assertForbidden();

        $resProfile = $this->actingAs($this->inactiveUser)->getJson('/api/v1/participant/profile');
        $resProfile->assertForbidden();
    }

    /**
     * 9. Pengguna yang belum login tidak dapat mengakses endpoint privat.
     */
    public function test_unauthenticated_user_cannot_access_private_endpoints(): void
    {
        $this->getJson('/api/v1/participant/dashboard')->assertUnauthorized();
        $this->getJson('/api/v1/participant/profile')->assertUnauthorized();
        $this->getJson('/api/v1/participant/registrations')->assertUnauthorized();
        $this->postJson('/api/v1/participant/registrations', [])->assertUnauthorized();
        $this->getJson('/api/v1/participant/teams')->assertUnauthorized();
        $this->getJson('/api/v1/participant/submissions')->assertUnauthorized();
        $this->getJson('/api/v1/participant/notifications')->assertUnauthorized();
    }

    /**
     * 10. Upload dokumen dengan format tidak valid harus ditolak.
     */
    public function test_invalid_document_upload_rejected(): void
    {
        $reg = Registration::factory()->create([
            'participant_id' => $this->participantA->id,
            'competition_id' => $this->indivComp->id,
            'status' => RegistrationStatus::DRAFT,
        ]);

        // File ekstensi terlarang .exe
        $invalidExe = UploadedFile::fake()->create('malicious.exe', 100, 'application/x-msdownload');
        $resExe = $this->actingAs($this->participantA)->postJson("/api/v1/participant/registrations/{$reg->id}/documents", [
            'document_type' => 'ktm',
            'file' => $invalidExe,
        ]);
        $resExe->assertUnprocessable();

        // File melebihi batas ukuran 5MB
        $oversizedFile = UploadedFile::fake()->create('huge.pdf', 6000, 'application/pdf');
        $resSize = $this->actingAs($this->participantA)->postJson("/api/v1/participant/registrations/{$reg->id}/documents", [
            'document_type' => 'ktm',
            'file' => $oversizedFile,
        ]);
        $resSize->assertUnprocessable();
    }

    /**
     * 11. Pendaftaran draft tidak dapat disubmit tanpa dokumen wajib.
     */
    public function test_cannot_submit_draft_without_documents(): void
    {
        $reg = Registration::factory()->create([
            'participant_id' => $this->participantA->id,
            'competition_id' => $this->indivComp->id,
            'status' => RegistrationStatus::DRAFT,
        ]);

        $res = $this->actingAs($this->participantA)->postJson("/api/v1/participant/registrations/{$reg->id}/submit");
        $res->assertUnprocessable();
    }

    /**
     * 12. Ketua tim tidak dapat dikeluarkan dari tim.
     */
    public function test_team_leader_cannot_be_removed(): void
    {
        $team = Team::create([
            'leader_id' => $this->participantA->id,
            'name' => 'Solid Team',
            'team_code' => 'SOLID1',
        ]);
        $team->members()->attach($this->participantA->id, ['member_role' => 'leader', 'joined_at' => now()]);

        $res = $this->actingAs($this->participantA)->deleteJson("/api/v1/participant/teams/{$team->id}/members/{$this->participantA->id}");
        // Ditinjau pada layer Policy: ketua tim tidak memiliki otorisasi untuk dikeluarkan dari tim sendiri
        $res->assertForbidden();
    }

    /**
     * 13. Submisi karya hanya dapat dilakukan setelah pendaftaran approved.
     */
    public function test_work_submission_only_allowed_when_registration_is_approved(): void
    {
        // Registration masih submitted (belum diapprove)
        $regSubmitted = Registration::factory()->create([
            'participant_id' => $this->participantA->id,
            'competition_id' => $this->indivComp->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        $res = $this->actingAs($this->participantA)->postJson('/api/v1/participant/submissions', [
            'registration_id' => $regSubmitted->id,
            'title' => 'Karya Terlalu Dini',
        ]);

        $res->assertForbidden();
    }

    /**
     * 14. Revisi hanya dapat dilakukan ketika status submission revision_required.
     */
    public function test_revision_only_allowed_when_status_is_revision_required(): void
    {
        $reg = Registration::factory()->create([
            'participant_id' => $this->participantA->id,
            'competition_id' => $this->indivComp->id,
            'status' => RegistrationStatus::APPROVED,
        ]);

        $sub = Submission::create([
            'registration_id' => $reg->id,
            'submitted_by' => $this->participantA->id,
            'title' => 'Karya Utama',
            'status' => SubmissionStatus::SUBMITTED,
            'submitted_at' => now(),
        ]);

        // Status masih submitted (belum diminta revisi)
        $res = $this->actingAs($this->participantA)->postJson("/api/v1/participant/submissions/{$sub->id}/revisions", [
            'notes' => 'Revisi sepihak',
        ]);
        $res->assertForbidden();

        // Ubah status ke revision_required
        $sub->update(['status' => SubmissionStatus::REVISION_REQUIRED]);

        $resAllowed = $this->actingAs($this->participantA)->postJson("/api/v1/participant/submissions/{$sub->id}/revisions", [
            'notes' => 'Perbaikan sesuai arahan juri',
        ]);
        $resAllowed->assertOk();
    }

    /**
     * 15. Anggota tidak dapat dihapus ketika tim memiliki pendaftaran aktif.
     */
    public function test_cannot_remove_member_when_team_has_active_registration(): void
    {
        $team = Team::create([
            'leader_id' => $this->participantA->id,
            'name' => 'Active Reg Team',
            'team_code' => 'ACTIVE1',
        ]);
        $team->members()->attach($this->participantA->id, ['member_role' => 'leader', 'joined_at' => now()]);
        $team->members()->attach($this->participantB->id, ['member_role' => 'member', 'joined_at' => now()]);

        // Pendaftaran aktif (submitted)
        Registration::factory()->create([
            'team_id' => $team->id,
            'participant_id' => null,
            'competition_id' => $this->teamComp->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        // Policy::removeMember mengecek update($user, $team) -> menolak jika ada pendaftaran aktif
        $res = $this->actingAs($this->participantA)->deleteJson("/api/v1/participant/teams/{$team->id}/members/{$this->participantB->id}");
        $res->assertForbidden();
    }

    /**
     * 16. Satu peserta tidak dapat melakukan pendaftaran aktif ganda pada kompetisi yang sama.
     */
    public function test_duplicate_active_registration_prevented(): void
    {
        // Pendaftaran 1 (draft)
        $this->actingAs($this->participantA)->postJson('/api/v1/participant/registrations', [
            'competition_id' => $this->indivComp->id,
        ])->assertCreated();

        // Pendaftaran 2 pada kompetisi yang sama ditolak (422)
        $res = $this->actingAs($this->participantA)->postJson('/api/v1/participant/registrations', [
            'competition_id' => $this->indivComp->id,
        ]);
        $res->assertUnprocessable();
    }

    /**
     * 17. Peserta tidak dapat menyetujui atau menolak pendaftarannya sendiri.
     */
    public function test_participant_cannot_approve_or_reject_own_registration(): void
    {
        $reg = Registration::factory()->create([
            'participant_id' => $this->participantA->id,
            'competition_id' => $this->indivComp->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        // 1. Peserta mencoba memanipulasi status lewat PUT update
        $this->actingAs($this->participantA)->putJson("/api/v1/participant/registrations/{$reg->id}", [
            'status' => 'approved',
            'notes' => 'Catatan normal',
        ]);

        // Status di database tetap SUBMITTED (tidak dapat diubah peserta)
        $this->assertDatabaseHas('registrations', [
            'id' => $reg->id,
            'status' => RegistrationStatus::SUBMITTED->value,
        ]);

        // 2. Peserta mencoba men-submit ulang pendaftaran yang sudah SUBMITTED
        $res = $this->actingAs($this->participantA)->postJson("/api/v1/participant/registrations/{$reg->id}/submit");
        $res->assertForbidden();
    }
}
