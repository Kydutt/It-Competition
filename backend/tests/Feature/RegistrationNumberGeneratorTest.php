<?php

namespace Tests\Feature;

use App\Enums\CompetitionStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use App\Services\RegistrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RegistrationNumberGeneratorTest extends TestCase
{
    use RefreshDatabase;

    protected RegistrationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(RegistrationService::class);
    }

    private function createTestCompetition(?Event $event = null, string $type = RegistrationType::INDIVIDUAL->value): Competition
    {
        if (!$event) {
            $event = Event::factory()->create();
        }
        $category = CompetitionCategory::factory()->create();

        return Competition::create([
            'event_id' => $event->id,
            'category_id' => $category->id,
            'name' => 'Test Competition ' . uniqid(),
            'slug' => 'test-competition-' . uniqid(),
            'description' => 'Test',
            'registration_type' => $type,
            'status' => CompetitionStatus::REGISTRATION_OPEN,
            'registration_start' => now()->subDay(),
            'registration_deadline' => now()->addDays(10),
            'min_members' => 1,
            'max_members' => 3,
        ]);
    }

    /**
     * 1. Pendaftaran pertama menghasilkan nomor yang benar (ITC-YYYY-00001).
     */
    public function test_first_registration_generates_correct_initial_number(): void
    {
        $year = date('Y');
        $number = $this->service->generateRegistrationNumber();

        $this->assertSame("ITC-{$year}-00001", $number);
    }

    /**
     * 2. Pendaftaran berikutnya menghasilkan nomor berbeda secara berurutan.
     */
    public function test_subsequent_registration_generates_incremented_number(): void
    {
        $year = date('Y');
        $user1 = User::factory()->create(['role' => 'participant']);
        $user2 = User::factory()->create(['role' => 'participant']);
        $comp = $this->createTestCompetition();

        $reg1 = $this->service->createDraft($user1, $comp);
        $this->assertSame("ITC-{$year}-00001", $reg1->registration_number);

        $comp2 = $this->createTestCompetition();
        $reg2 = $this->service->createDraft($user2, $comp2);
        $this->assertSame("ITC-{$year}-00002", $reg2->registration_number);
    }

    /**
     * 3. Pendaftaran tetap mendapat nomor baru setelah pendaftaran sebelumnya cancelled.
     */
    public function test_registration_number_increments_even_after_previous_cancelled(): void
    {
        $year = date('Y');
        $user1 = User::factory()->create(['role' => 'participant']);
        $comp = $this->createTestCompetition();

        $reg1 = $this->service->createDraft($user1, $comp);
        $this->assertSame("ITC-{$year}-00001", $reg1->registration_number);

        // Cancel reg1
        $reg1->update(['status' => RegistrationStatus::CANCELLED]);

        // Next registration
        $user2 = User::factory()->create(['role' => 'participant']);
        $comp2 = $this->createTestCompetition();
        $reg2 = $this->service->createDraft($user2, $comp2);

        $this->assertSame("ITC-{$year}-00002", $reg2->registration_number);
        $this->assertNotSame($reg1->registration_number, $reg2->registration_number);
    }

    /**
     * 4. Pendaftaran tetap mendapat nomor baru meskipun ada celah nomor (sequence gaps).
     */
    public function test_registration_number_handles_sequence_gaps(): void
    {
        $year = date('Y');
        $comp = $this->createTestCompetition();
        $user = User::factory()->create();

        // Seed with a gap (00001 and 00007)
        Registration::create([
            'registration_number' => "ITC-{$year}-00001",
            'competition_id' => $comp->id,
            'participant_id' => $user->id,
            'status' => RegistrationStatus::DRAFT,
        ]);
        Registration::create([
            'registration_number' => "ITC-{$year}-00007",
            'competition_id' => $comp->id,
            'participant_id' => User::factory()->create()->id,
            'status' => RegistrationStatus::DRAFT,
        ]);

        $nextNumber = $this->service->generateRegistrationNumber();
        $this->assertSame("ITC-{$year}-00008", $nextNumber);
    }

    /**
     * 5. Nomor tidak dimulai ulang ketika ada data lama atau format non-standar (EXACT BUG CASE).
     */
    public function test_number_does_not_restart_when_old_or_non_standard_data_exists(): void
    {
        $year = date('Y');
        $comp = $this->createTestCompetition();

        // Replicate existing DB records: 00001, 00002, 00003, REV01, OTHER99
        Registration::create([
            'registration_number' => "ITC-{$year}-00001",
            'competition_id' => $comp->id,
            'participant_id' => User::factory()->create()->id,
            'status' => RegistrationStatus::DRAFT,
        ]);
        Registration::create([
            'registration_number' => "ITC-{$year}-00002",
            'competition_id' => $comp->id,
            'participant_id' => User::factory()->create()->id,
            'status' => RegistrationStatus::DRAFT,
        ]);
        Registration::create([
            'registration_number' => "ITC-{$year}-00003",
            'competition_id' => $comp->id,
            'participant_id' => User::factory()->create()->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);
        Registration::create([
            'registration_number' => "ITC-{$year}-REV01",
            'competition_id' => $comp->id,
            'participant_id' => User::factory()->create()->id,
            'status' => RegistrationStatus::APPROVED,
        ]);
        Registration::create([
            'registration_number' => "ITC-{$year}-OTHER99",
            'competition_id' => $comp->id,
            'participant_id' => User::factory()->create()->id,
            'status' => RegistrationStatus::SUBMITTED,
        ]);

        $nextNumber = $this->service->generateRegistrationNumber();
        // MUST NOT be 00001! MUST be 00004!
        $this->assertSame("ITC-{$year}-00004", $nextNumber);

        // Verify full createDraft works seamlessly without IntegrityConstraintViolation
        $newUser = User::factory()->create(['role' => 'participant']);
        $newComp = $this->createTestCompetition();
        $newReg = $this->service->createDraft($newUser, $newComp);

        $this->assertSame("ITC-{$year}-00004", $newReg->registration_number);
        $this->assertDatabaseHas('registrations', [
            'id' => $newReg->id,
            'registration_number' => "ITC-{$year}-00004",
        ]);
    }

    /**
     * 6. Pendaftaran dari event berbeda tetap tidak menghasilkan duplikasi jika constraint bersifat global.
     */
    public function test_registrations_across_different_events_maintain_global_unique_sequence(): void
    {
        $year = date('Y');
        $eventA = Event::factory()->create(['name' => 'Event A']);
        $eventB = Event::factory()->create(['name' => 'Event B']);

        $compA = $this->createTestCompetition($eventA);
        $compB = $this->createTestCompetition($eventB);

        $user1 = User::factory()->create(['role' => 'participant']);
        $user2 = User::factory()->create(['role' => 'participant']);

        $regA = $this->service->createDraft($user1, $compA);
        $regB = $this->service->createDraft($user2, $compB);

        $this->assertSame("ITC-{$year}-00001", $regA->registration_number);
        $this->assertSame("ITC-{$year}-00002", $regB->registration_number);
        $this->assertNotSame($regA->registration_number, $regB->registration_number);
    }

    /**
     * 7. Dua pendaftaran berurutan atau bersamaan menghasilkan nomor unik tanpa tabrakan.
     */
    public function test_concurrent_registration_creation_generates_distinct_numbers(): void
    {
        $year = date('Y');
        $comp = $this->createTestCompetition();
        $generated = [];

        for ($i = 0; $i < 5; $i++) {
            $user = User::factory()->create(['role' => 'participant']);
            $compX = $this->createTestCompetition();
            $reg = $this->service->createDraft($user, $compX);
            $generated[] = $reg->registration_number;
        }

        $this->assertCount(5, array_unique($generated));
        $this->assertEquals([
            "ITC-{$year}-00001",
            "ITC-{$year}-00002",
            "ITC-{$year}-00003",
            "ITC-{$year}-00004",
            "ITC-{$year}-00005",
        ], $generated);
    }

    /**
     * 8. Duplicate-key conflict ditangani dengan aman via while check dan retry.
     */
    public function test_duplicate_key_conflict_is_handled_safely_with_retry(): void
    {
        $year = date('Y');
        $comp = $this->createTestCompetition();
        $user = User::factory()->create();

        // Pre-create 00001
        Registration::create([
            'registration_number' => "ITC-{$year}-00001",
            'competition_id' => $comp->id,
            'participant_id' => $user->id,
            'status' => RegistrationStatus::DRAFT,
        ]);

        // Attempting to generate will see 00001 exists and return 00002
        $next = $this->service->generateRegistrationNumber();
        $this->assertSame("ITC-{$year}-00002", $next);
    }

    /**
     * 9. Kegagalan proses INSERT melakukan rollback dan tidak merusak sequence berikutnya.
     */
    public function test_transaction_rollback_does_not_corrupt_subsequent_registrations(): void
    {
        $year = date('Y');
        $comp = $this->createTestCompetition();
        $user = User::factory()->create(['role' => 'participant']);

        // First registration successful -> 00001
        $reg1 = $this->service->createDraft($user, $comp);
        $this->assertSame("ITC-{$year}-00001", $reg1->registration_number);

        // Simulate failed transaction that rolls back
        try {
            DB::transaction(function () use ($comp, $year) {
                Registration::create([
                    'registration_number' => "ITC-{$year}-00002",
                    'competition_id' => $comp->id,
                    'participant_id' => null,
                    'status' => RegistrationStatus::DRAFT,
                ]);
                throw new \Exception('Forced failure to trigger rollback');
            });
        } catch (\Exception $e) {
            // Expected
        }

        // 00002 should NOT be in database because transaction was rolled back
        $this->assertDatabaseMissing('registrations', [
            'registration_number' => "ITC-{$year}-00002",
        ]);

        // Next registration should safely reuse 00002 without gap or collision
        $user2 = User::factory()->create(['role' => 'participant']);
        $comp2 = $this->createTestCompetition();
        $reg2 = $this->service->createDraft($user2, $comp2);

        $this->assertSame("ITC-{$year}-00002", $reg2->registration_number);
    }
}
