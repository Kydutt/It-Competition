<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\RegistrationFeeBackfillService;
use App\Support\MoneyHelper;
use Illuminate\Console\Command;
use InvalidArgumentException;

class ConfirmRegistrationFeeSnapshotCommand extends Command
{
    protected $signature = 'registrations:confirm-fee-snapshot
                            {--ids= : Comma-separated registration IDs that have been explicitly audited}
                            {--fee= : Verified whole-Rupiah registration fee (e.g. 0 or 50000)}
                            {--reason= : Audit reason/evidence recorded into activity_logs}
                            {--dry-run : Preview confirmation without writing database changes}';

    protected $description = 'Explicitly confirm registration_fee_snapshot for manually verified legacy registrations';

    public function handle(RegistrationFeeBackfillService $service): int
    {
        $rawIds = (string) ($this->option('ids') ?? '');
        $rawFee = $this->option('fee');
        $reason = (string) ($this->option('reason') ?? '');
        $dryRun = (bool) $this->option('dry-run');

        if (trim($rawIds) === '' || $rawFee === null || trim((string) $rawFee) === '' || trim($reason) === '') {
            $this->error('Parameter --ids, --fee, dan --reason wajib diisi.');

            return self::FAILURE;
        }

        $ids = array_values(array_filter(
            array_map(fn (string $part) => (int) trim($part), explode(',', $rawIds)),
            fn (int $id) => $id > 0
        ));

        try {
            $feeRupiah = MoneyHelper::parseWholeRupiahStrict((string) $rawFee);
            if ($feeRupiah === null) {
                throw new InvalidArgumentException('Nominal --fee tidak boleh kosong.');
            }

            $result = $service->confirmExplicitRegistrations($ids, $feeRupiah, $reason, null, $dryRun);
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info(($dryRun ? '[DRY-RUN] ' : '') . "Confirmed snapshots: {$result['confirmed_count']}");
        $this->info("Confirmed IDs: " . ($result['confirmed_ids'] === [] ? '-' : implode(', ', $result['confirmed_ids'])));
        $this->warn("Skipped: {$result['skipped_count']}");

        if ($result['skipped'] !== []) {
            $this->table(
                ['ID', 'Alasan'],
                array_map(fn (array $row) => [$row['id'], $row['reason']], $result['skipped'])
            );
        }

        return self::SUCCESS;
    }
}
