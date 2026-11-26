<?php

namespace Tests\Integration;

use App\Enums\CompetitionStatus;
use App\Enums\EventStatus;
use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Enums\RegistrationType;
use App\Enums\Role;
use App\Exceptions\PaymentException;
use App\Models\Competition;
use App\Models\CompetitionCategory;
use App\Models\Event;
use App\Models\EventSetting;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\User;
use App\Services\PaymentService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MySqlPaymentConcurrencyTest extends TestCase
{
    protected string $signatureSecret = 'MYSQL-TEST-SIG-SECRET';

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

        Config::set('midtrans.server_key', 'SB-Mid-server-MYSQLTEST');
        Config::set('midtrans.signature_secret', $this->signatureSecret);
        Config::set('midtrans.client_key', 'SB-Mid-client-MYSQLTEST');
        Config::set('midtrans.is_production', false);

        Artisan::call('migrate:fresh', ['--force' => true]);
    }

    public function test_mysql_enforces_single_paid_virtual_unique_constraint_and_serializes_parallel_settlements(): void
    {
        // Verify virtual generated column and unique key actually exist in MySQL
        $columns = collect(DB::select('SHOW COLUMNS FROM payments'))->keyBy('Field');
        $this->assertTrue($columns->has('paid_registration_id'));

        $indexes = collect(DB::select("SHOW INDEX FROM payments WHERE Key_name = 'uq_payment_single_paid_registration'"));
        $this->assertNotEmpty($indexes);

        $participant = User::factory()->create(['role' => Role::PARTICIPANT, 'is_active' => true]);
        $event = Event::factory()->create(['status' => EventStatus::PUBLISHED]);
        $category = CompetitionCategory::factory()->create();

        EventSetting::create([
            'event_id' => $event->id,
            'setting_key' => 'payment_enabled',
            'setting_value' => 'true',
        ]);

        $competition = Competition::factory()->create([
            'event_id' => $event->id,
            'category_id' => $category->id,
            'registration_type' => RegistrationType::INDIVIDUAL,
            'registration_fee' => 150000.00,
            'registration_start' => now()->subDays(2),
            'registration_deadline' => now()->addDays(10),
            'status' => CompetitionStatus::REGISTRATION_OPEN,
        ]);

        $registration = Registration::factory()->submitted()->create([
            'competition_id' => $competition->id,
            'participant_id' => $participant->id,
        ]);

        $orderA = 'ITC-PAY-MYSQL-RACE-A';
        $orderB = 'ITC-PAY-MYSQL-RACE-B';

        Payment::factory()->create([
            'registration_id' => $registration->id,
            'user_id' => $participant->id,
            'order_id' => $orderA,
            'amount' => 150000.00,
            'status' => PaymentStatus::PENDING,
        ]);

        Payment::factory()->create([
            'registration_id' => $registration->id,
            'user_id' => $participant->id,
            'order_id' => $orderB,
            'amount' => 150000.00,
            'status' => PaymentStatus::PENDING,
        ]);

        // Prove raw DB unique constraint still blocks any unfiltered second paid row at MySQL level
        try {
            DB::beginTransaction();
            DB::table('payments')->where('order_id', $orderA)->update(['status' => 'paid']);
            $caughtRaw = false;
            try {
                DB::table('payments')->where('order_id', $orderB)->update(['status' => 'paid']);
            } catch (QueryException $e) {
                $caughtRaw = str_contains($e->getMessage(), 'uq_payment_single_paid_registration')
                    || ((int) ($e->errorInfo[1] ?? 0) === 1062);
            }
            $this->assertTrue($caughtRaw, 'Expected MySQL uq_payment_single_paid_registration constraint violation on second paid row.');
        } finally {
            DB::rollBack();
        }

        // Launch two concurrent OS processes hitting MySQL simultaneously for orderA and orderB
        $workerScript = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'itcomp_mysql_race_worker_' . uniqid() . '.php';
        $barrierFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'itcomp_mysql_barrier_' . uniqid();

        $scriptCode = <<<'PHP'
<?php
require $argv[1] . '/vendor/autoload.php';
$app = require $argv[1] . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

\Illuminate\Support\Facades\Config::set('midtrans.signature_secret', $argv[3]);
$orderId = $argv[2];
$barrier = $argv[4];
$gross = '150000.00';
$statusCode = '200';
$payload = [
    'order_id' => $orderId,
    'status_code' => $statusCode,
    'gross_amount' => $gross,
    'transaction_status' => 'settlement',
    'fraud_status' => 'accept',
    'payment_type' => 'qris',
    'transaction_id' => 'tx-' . $orderId,
    'signature_key' => hash('sha512', $orderId . $statusCode . $gross . $argv[3]),
];

while (! file_exists($barrier)) {
    usleep(5000);
}

try {
    $res = app(\App\Services\PaymentService::class)->handleWebhook($payload);
    echo json_encode(['http' => 200, 'status' => $res['payment']->status->value]);
} catch (\App\Exceptions\PaymentException $e) {
    echo json_encode(['http' => $e->statusCode, 'message' => $e->getMessage()]);
}
PHP;

        file_put_contents($workerScript, $scriptCode);

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
            $descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
            $cmdA = sprintf('%s %s %s %s %s %s', escapeshellarg(PHP_BINARY), escapeshellarg($workerScript), escapeshellarg($backendPath), escapeshellarg($orderA), escapeshellarg($this->signatureSecret), escapeshellarg($barrierFile));
            $cmdB = sprintf('%s %s %s %s %s %s', escapeshellarg(PHP_BINARY), escapeshellarg($workerScript), escapeshellarg($backendPath), escapeshellarg($orderB), escapeshellarg($this->signatureSecret), escapeshellarg($barrierFile));

            $procA = proc_open($cmdA, $descriptors, $pipesA, $backendPath, $env);
            $procB = proc_open($cmdB, $descriptors, $pipesB, $backendPath, $env);
            usleep(350000);
            file_put_contents($barrierFile, 'go');

            $outA = stream_get_contents($pipesA[1]);
            $errA = stream_get_contents($pipesA[2]);
            fclose($pipesA[1]);
            fclose($pipesA[2]);
            $exitA = proc_close($procA);

            $outB = stream_get_contents($pipesB[1]);
            $errB = stream_get_contents($pipesB[2]);
            fclose($pipesB[1]);
            fclose($pipesB[2]);
            $exitB = proc_close($procB);

            $this->assertSame(0, $exitA, "Worker A error: {$errA}");
            $this->assertSame(0, $exitB, "Worker B error: {$errB}");

            $resA = json_decode(trim((string) $outA), true);
            $resB = json_decode(trim((string) $outB), true);
            $this->assertIsArray($resA, "Invalid worker A output: {$outA}");
            $this->assertIsArray($resB, "Invalid worker B output: {$outB}");

            $codes = [$resA['http'], $resB['http']];
            sort($codes);
            $this->assertSame([200, 409], $codes, 'Exactly one worker must succeed (200) and the conflicting worker must get 409 (never 500).');

            // Verify DB invariant: strictly 1 paid payment, 1 cancelled conflict, intact registration status
            $paidCount = Payment::where('registration_id', $registration->id)
                ->whereIn('status', [PaymentStatus::PAID->value, PaymentStatus::VERIFIED->value])
                ->count();
            $cancelledCount = Payment::where('registration_id', $registration->id)
                ->where('status', PaymentStatus::CANCELLED->value)
                ->count();

            $this->assertSame(1, $paidCount);
            $this->assertSame(1, $cancelledCount);
            $this->assertSame(RegistrationStatus::SUBMITTED, $registration->fresh()->status);

            // Duplicate replay of both notifications afterwards must both return 200 idempotently (no 500, no status change)
            $service = app(PaymentService::class);
            foreach ([$orderA, $orderB] as $orderId) {
                $replay = $service->handleWebhook([
                    'order_id' => $orderId,
                    'status_code' => '200',
                    'gross_amount' => '150000.00',
                    'transaction_status' => 'settlement',
                    'fraud_status' => 'accept',
                    'payment_type' => 'qris',
                    'transaction_id' => 'tx-' . $orderId,
                    'signature_key' => hash('sha512', $orderId . '200' . '150000.00' . $this->signatureSecret),
                ]);
                $this->assertFalse($replay['updated']);
            }
        } finally {
            @unlink($barrierFile);
            @unlink($workerScript);
        }
    }
}
