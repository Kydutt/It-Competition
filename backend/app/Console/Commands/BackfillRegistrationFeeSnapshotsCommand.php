<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\RegistrationFeeBackfillService;
use Illuminate\Console\Command;

class BackfillRegistrationFeeSnapshotsCommand extends Command
{
    protected $signature = 'registrations:backfill-fee-snapshots
                            {--dry-run : Audit and report what would be backfilled without modifying database}';

    protected $description = 'Run deterministic conservative backfill for missing registration_fee_snapshot values';

    public function handle(RegistrationFeeBackfillService $service): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $report = $service->runGeneralBackfill($dryRun);

        $this->info(($dryRun ? '[DRY-RUN] ' : '') . "Total unresolved registrations inspected: {$report['total_unresolved']}");
        $this->info("Backfilled deterministically: {$report['backfilled_count']}");
        $this->warn("Remaining ambiguous (NULL): {$report['ambiguous_count']}");

        if ($report['backfilled'] !== []) {
            $this->table(
                ['ID', 'No. Pendaftaran', 'Biaya (Rp)', 'Bukti'],
                array_map(fn (array $row) => [
                    $row['id'],
                    $row['registration_number'],
                    $row['fee_rupiah'],
                    $row['evidence'],
                ], $report['backfilled'])
            );
        }

        if ($report['ambiguous'] !== []) {
            $this->table(
                ['ID', 'No. Pendaftaran', 'Kompetisi ID', 'Alasan Ambigu'],
                array_map(fn (array $row) => [
                    $row['id'],
                    $row['registration_number'],
                    $row['competition_id'],
                    $row['reason'],
                ], $report['ambiguous'])
            );
        }

        return self::SUCCESS;
    }
}
