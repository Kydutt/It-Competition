<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Models\ActivityLog;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MySqlRegistrationFeeConcurrencyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('MySQL concurrency integration test requires DB_CONNECTION=mysql on an isolated test schema.');
        }

        $dbName = (string) config('database.connections.mysql.database');
        if ($dbName === '' || $dbName === 'it_competition') {
            $this->fail('Refusing to run destructive integration setup against primary dev database. Use an isolated test schema such as it_competition_test.');
        }

        Artisan::call('migrate:fresh', ['--force' => true]);
    }

    public function test_mysql_innodb_serializes_registration_snapshot_against_concurrent_admin_fee_update_without_deadlock(): void
    {
        $admin = User::factory()->create(['role' => Role::ADMIN, 'is_active' => true]);
        $userA = User::factory()->create(['role' => Role::PARTICIPANT, 'is_active' => true]);
        $userB = User::factory()->create(['role' => Role::PARTICIPANT, 'is_active' => true]);
        $userWait = User::factory()->create(['role' => Role::PARTICIPANT, 'is_active' => true]);

        $event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);
        $category = CompetitionCategory::factory()->create();

        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
            'registration_type' => RegistrationType::INDIVIDUAL,
            'registration_fee' => 50000.00,
            'registration_start' => now()->subDay(),
            'registration_deadline' => now()->addDays(10),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        // Test 1: Prove RegistrationService::createDraft() blocks on InnoDB lockForUpdate() held by Admin update
        $barrierHeld = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'itcomp_fee_lock_held_' . uniqid();
        $holderScript = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'itcomp_fee_holder_' . uniqid() . '.php';
        $regScript = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'itcomp_fee_reg_' . uniqid() . '.php';

        $holderCode = <<<'PHP'
<?php
require $argv[1] . '/vendor/autoload.php';
$app = require $argv[1] . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$compId = (int) $argv[2];
$adminId = (int) $argv[3];
$barrierFile = $argv[4];
$newFee = (int) $argv[5];

$admin = \App\Models\User::findOrFail($adminId);

\Illuminate\Support\Facades\DB::transaction(function () use ($compId, $admin, $barrierFile, $newFee) {
    $locked = \App\Models\Competition::where('id', $compId)->lockForUpdate()->firstOrFail();
    $oldValues = $locked->toArray();

    file_put_contents($barrierFile, 'locked');
    usleep(500000); // Hold InnoDB row lock for 500ms while concurrent registrant waits

    $locked->update([
        'registration_fee' => \App\Support\MoneyHelper::rupiahToDecimalString($newFee),
    ]);
    $fresh = $locked->fresh();

    \App\Services\ActivityLogService::log(
        action: 'competition.update',
        entityType: 'Competition',
        entityId: $fresh->id,
        oldValues: $oldValues,
        newValues: $fresh->toArray(),
        actor: $admin
    );
});

echo json_encode(['status' => 'updated', 'new_fee' => $newFee]);
PHP;

        $regCode = <<<'PHP'
<?php
require $argv[1] . '/vendor/autoload.php';
$app = require $argv[1] . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$compId = (int) $argv[2];
$userId = (int) $argv[3];
$waitForFile = $argv[4];
$mode = $argv[5];

while (! file_exists($waitForFile)) {
    usleep(5000);
}

if ($mode === 'after_lock_acquired') {
    usleep(100000); // Ensure holder already owns InnoDB X-lock on competition row
}

$start = microtime(true);
$user = \App\Models\User::findOrFail($userId);
// Fetch stale model before transaction to prove createDraft() reloads locked row inside transaction!
$staleComp = \App\Models\Competition::findOrFail($compId);
$reg = app(\App\Services\RegistrationService::class)->createDraft($user, $staleComp);
$elapsedMs = (int) round((microtime(true) - $start) * 1000);

echo json_encode([
    'registration_id' => $reg->id,
    'snapshot' => $reg->effectiveRegistrationFeeRupiah(),
    'elapsed_ms' => $elapsedMs,
]);
PHP;

        file_put_contents($holderScript, $holderCode);
        file_put_contents($regScript, $regCode);

        $backendPath = base_path();
        $baseEnv = array_filter(array_merge($_ENV, $_SERVER), static fn ($value) => is_scalar($value));
        $env = array_merge($baseEnv, [
            'DB_CONNECTION' => 'mysql',
            'DB_DATABASE' => (string) config('database.connections.mysql.database'),
            'DB_HOST' => (string) config('database.connections.mysql.host'),
            'DB_PORT' => (string) config('database.connections.mysql.port'),
            'DB_USERNAME' => (string) config('database.connections.mysql.username'),
            'DB_PASSWORD' => (string) config('database.connections.mysql.password'),
        ]);

        try {
            // Part A: Strict wait proof — holder acquires competition X-lock and updates 50000 -> 90000;
            // registrant holding stale Competition(50000) MUST block until commit and snapshot 90000.
            $descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
            $cmdHold = sprintf('%s %s %s %d %d %s 90000', escapeshellarg(PHP_BINARY), escapeshellarg($holderScript), escapeshellarg($backendPath), $competition->id, $admin->id, escapeshellarg($barrierHeld));
            $cmdWait = sprintf('%s %s %s %d %d %s after_lock_acquired', escapeshellarg(PHP_BINARY), escapeshellarg($regScript), escapeshellarg($backendPath), $competition->id, $userWait->id, escapeshellarg($barrierHeld));

            $pHold = proc_open($cmdHold, $descriptors, $pipesHold, $backendPath, $env);
            $pWait = proc_open($cmdWait, $descriptors, $pipesWait, $backendPath, $env);

            $outHold = stream_get_contents($pipesHold[1]);
            $errHold = stream_get_contents($pipesHold[2]);
            fclose($pipesHold[1]);
            fclose($pipesHold[2]);
            $exitHold = proc_close($pHold);

            $outWait = stream_get_contents($pipesWait[1]);
            $errWait = stream_get_contents($pipesWait[2]);
            fclose($pipesWait[1]);
            fclose($pipesWait[2]);
            $exitWait = proc_close($pWait);

            $this->assertSame(0, $exitHold, "Holder error: {$errHold}");
            $this->assertSame(0, $exitWait, "Waiting registrant error: {$errWait}");

            $waitData = json_decode(trim((string) $outWait), true);
            $this->assertIsArray($waitData, "Invalid registrant output: {$outWait}");
            $this->assertSame(90000, $waitData['snapshot'], 'Waiting registrant must see post-commit 90000 fee even when starting with stale Competition model.');
            $this->assertGreaterThanOrEqual(250, $waitData['elapsed_ms'], 'Registrant must block on InnoDB lockForUpdate until admin transaction commits.');

            // Part B: Three-way simultaneous race — 2 processes creating registrations + 1 admin updating 90000 -> 125000
            @unlink($barrierHeld);
            $cmdAdminRace = sprintf('%s %s %s %d %d %s 125000', escapeshellarg(PHP_BINARY), escapeshellarg($holderScript), escapeshellarg($backendPath), $competition->id, $admin->id, escapeshellarg($barrierHeld . '_ignore_unused'));
            // Use simultaneous shared go-barrier for 3 processes (admin controller update via HTTP/Controller-like transaction + 2 createDraft processes)
            $goBarrier = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'itcomp_3way_go_' . uniqid();
            $adminRaceScript = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'itcomp_admin_3way_' . uniqid() . '.php';
            $adminRaceCode = <<<'PHP'
<?php
require $argv[1] . '/vendor/autoload.php';
$app = require $argv[1] . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$compId = (int) $argv[2];
$adminId = (int) $argv[3];
$goFile = $argv[4];
$newFee = (int) $argv[5];

while (! file_exists($goFile)) {
    usleep(5000);
}

$admin = \App\Models\User::findOrFail($adminId);
$comp = \App\Models\Competition::findOrFail($compId);
$req = \App\Http\Requests\Admin\UpdateCompetitionRequest::create("/api/v1/admin/competitions/{$compId}", 'PUT', [
    'registration_fee' => $newFee,
]);
$req->setUserResolver(fn () => $admin);
$req->setContainer($app)->validateResolved();

$res = app(\App\Http\Controllers\Api\Admin\CompetitionController::class)->update($req, $comp);
echo json_encode(['status' => $res->getStatusCode(), 'fee' => $newFee]);
PHP;
            file_put_contents($adminRaceScript, $adminRaceCode);

            $pAdmin = proc_open(sprintf('%s %s %s %d %d %s 125000', escapeshellarg(PHP_BINARY), escapeshellarg($adminRaceScript), escapeshellarg($backendPath), $competition->id, $admin->id, escapeshellarg($goBarrier)), $descriptors, $pipesA, $backendPath, $env);
            $pReg1 = proc_open(sprintf('%s %s %s %d %d %s immediate', escapeshellarg(PHP_BINARY), escapeshellarg($regScript), escapeshellarg($backendPath), $competition->id, $userA->id, escapeshellarg($goBarrier)), $descriptors, $pipes1, $backendPath, $env);
            $pReg2 = proc_open(sprintf('%s %s %s %d %d %s immediate', escapeshellarg(PHP_BINARY), escapeshellarg($regScript), escapeshellarg($backendPath), $competition->id, $userB->id, escapeshellarg($goBarrier)), $descriptors, $pipes2, $backendPath, $env);

            usleep(350000);
            file_put_contents($goBarrier, 'go');

            $outA = stream_get_contents($pipesA[1]);
            $errA = stream_get_contents($pipesA[2]);
            fclose($pipesA[1]);
            fclose($pipesA[2]);
            $exitA = proc_close($pAdmin);

            $out1 = stream_get_contents($pipes1[1]);
            $err1 = stream_get_contents($pipes1[2]);
            fclose($pipes1[1]);
            fclose($pipes1[2]);
            $exit1 = proc_close($pReg1);

            $out2 = stream_get_contents($pipes2[1]);
            $err2 = stream_get_contents($pipes2[2]);
            fclose($pipes2[1]);
            fclose($pipes2[2]);
            $exit2 = proc_close($pReg2);

            $this->assertSame(0, $exitA, "Admin 3-way race error: {$errA}");
            $this->assertSame(0, $exit1, "Reg 1 3-way race error: {$err1}");
            $this->assertSame(0, $exit2, "Reg 2 3-way race error: {$err2}");

            $resAdmin = json_decode(trim((string) $outA), true);
            $res1 = json_decode(trim((string) $out1), true);
            $res2 = json_decode(trim((string) $out2), true);

            $this->assertSame(200, $resAdmin['status'] ?? null);
            $this->assertContains($res1['snapshot'], [90000, 125000]);
            $this->assertContains($res2['snapshot'], [90000, 125000]);
            $this->assertNotNull(Registration::findOrFail($res1['registration_id'])->registration_fee_snapshot);
            $this->assertNotNull(Registration::findOrFail($res2['registration_id'])->registration_fee_snapshot);
            $this->assertSame('125000.00', $competition->fresh()->registration_fee);
            $this->assertGreaterThanOrEqual(
                2,
                ActivityLog::where('entity_type', 'Competition')
                    ->where('entity_id', $competition->id)
                    ->where('action', 'competition.update')
                    ->count()
            );
        } finally {
            @unlink($barrierHeld);
            @unlink($holderScript);
            @unlink($regScript);
            if (isset($goBarrier)) {
                @unlink($goBarrier);
            }
            if (isset($adminRaceScript)) {
                @unlink($adminRaceScript);
            }
        }
    }
}
