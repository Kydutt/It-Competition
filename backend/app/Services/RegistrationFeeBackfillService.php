<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\User;
use App\Support\MoneyHelper;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Throwable;

class RegistrationFeeBackfillService
{
    /**
     * Conservative, deterministic, idempotent general backfill for registrations
     * whose registration_fee_snapshot is NULL.
     *
     * Rules:
     * 1. Validates competition activity_logs chain integrity chronologically (created_at ASC, id ASC).
     * 2. Uses competition.update fee history relative to registrations.created_at (Tier 2).
     * 3. Treats payments.amount across ALL payment statuses only as corroborating evidence
     *    when zero fee changes occurred between registrations.created_at and payments.created_at (Tier 1).
     * 4. Leaves ambiguous/unprovable registrations as NULL (Tier 3) without fallback to current fee.
     *
     * @return array{
     *   total_unresolved: int,
     *   backfilled_count: int,
     *   ambiguous_count: int,
     *   backfilled: list<array{id: int, registration_number: string, fee_rupiah: int, evidence: string}>,
     *   ambiguous: list<array{id: int, registration_number: string, competition_id: int, reason: string}>
     * }
     */
    public function runGeneralBackfill(bool $dryRun = false, ?User $actor = null): array
    {
        $unresolved = Registration::query()
            ->whereNull('registration_fee_snapshot')
            ->with(['payments' => fn ($q) => $q->orderBy('created_at')->orderBy('id')])
            ->orderBy('id')
            ->get();

        $competitionHistories = [];
        $backfilled = [];
        $ambiguous = [];

        foreach ($unresolved as $registration) {
            $competitionId = (int) $registration->competition_id;

            if (! array_key_exists($competitionId, $competitionHistories)) {
                $competitionHistories[$competitionId] = $this->analyzeCompetitionHistory($competitionId);
            }

            $history = $competitionHistories[$competitionId];
            $resolution = $this->resolveRegistrationSnapshot($registration, $history);

            if ($resolution['resolved'] === false) {
                $ambiguous[] = [
                    'id' => (int) $registration->id,
                    'registration_number' => (string) $registration->registration_number,
                    'competition_id' => $competitionId,
                    'reason' => $resolution['reason'],
                ];
                continue;
            }

            $feeRupiah = $resolution['fee_rupiah'];
            $feeDecimal = MoneyHelper::rupiahToDecimalString($feeRupiah);

            if (! $dryRun) {
                DB::transaction(function () use ($registration, $feeDecimal, $resolution, $actor) {
                    $query = Registration::where('id', $registration->id);
                    if (DB::connection()->getDriverName() !== 'sqlite') {
                        $query->lockForUpdate();
                    }

                    $locked = $query->first();
                    if (! $locked || $locked->registration_fee_snapshot !== null) {
                        return;
                    }

                    $locked->update([
                        'registration_fee_snapshot' => $feeDecimal,
                        'fee_locked_at' => $locked->created_at ?? now(),
                    ]);

                    ActivityLogService::log(
                        action: 'registration.fee_snapshot_backfilled',
                        entityType: 'Registration',
                        entityId: (int) $locked->id,
                        oldValues: ['registration_fee_snapshot' => null],
                        newValues: [
                            'registration_fee_snapshot' => $feeDecimal,
                            'evidence' => $resolution['evidence'],
                        ],
                        actor: $actor
                    );
                });
            }

            $backfilled[] = [
                'id' => (int) $registration->id,
                'registration_number' => (string) $registration->registration_number,
                'fee_rupiah' => $feeRupiah,
                'evidence' => $resolution['evidence'],
            ];
        }

        return [
            'total_unresolved' => $unresolved->count(),
            'backfilled_count' => count($backfilled),
            'ambiguous_count' => count($ambiguous),
            'backfilled' => $backfilled,
            'ambiguous' => $ambiguous,
        ];
    }

    /**
     * Explicit controlled confirmation for manually verified legacy registrations.
     *
     * @param  list<int>  $registrationIds
     * @return array{
     *   confirmed_count: int,
     *   skipped_count: int,
     *   confirmed_ids: list<int>,
     *   skipped: list<array{id: int, reason: string}>
     * }
     */
    public function confirmExplicitRegistrations(
        array $registrationIds,
        int $feeRupiah,
        string $reason,
        ?User $actor = null,
        bool $dryRun = false
    ): array {
        $cleanIds = array_values(array_unique(array_filter(array_map('intval', $registrationIds), fn (int $id) => $id > 0)));
        if ($cleanIds === []) {
            throw new InvalidArgumentException('Minimal satu registration ID valid harus disertakan.');
        }

        $trimmedReason = trim($reason);
        if ($trimmedReason === '') {
            throw new InvalidArgumentException('Alasan verifikasi (reason) wajib diisi untuk konfirmasi snapshot manual.');
        }

        $feeDecimal = MoneyHelper::rupiahToDecimalString($feeRupiah);

        $confirmedIds = [];
        $skipped = [];

        DB::transaction(function () use ($cleanIds, $feeDecimal, $trimmedReason, $actor, $dryRun, &$confirmedIds, &$skipped) {
            $query = Registration::whereIn('id', $cleanIds)->orderBy('id');
            if (DB::connection()->getDriverName() !== 'sqlite') {
                $query->lockForUpdate();
            }

            /** @var Collection<int, Registration> $found */
            $found = $query->get()->keyBy('id');

            foreach ($cleanIds as $id) {
                $reg = $found->get($id);
                if (! $reg) {
                    $skipped[] = ['id' => $id, 'reason' => 'Registrasi tidak ditemukan.'];
                    continue;
                }

                if ($reg->registration_fee_snapshot !== null) {
                    $existingRupiah = $reg->effectiveRegistrationFeeRupiah();
                    $skipped[] = [
                        'id' => $id,
                        'reason' => "Snapshot sudah terisi ({$existingRupiah}); dilewati secara idempoten.",
                    ];
                    continue;
                }

                if (! $dryRun) {
                    $reg->update([
                        'registration_fee_snapshot' => $feeDecimal,
                        'fee_locked_at' => $reg->created_at ?? now(),
                    ]);

                    ActivityLogService::log(
                        action: 'registration.fee_snapshot_confirmed',
                        entityType: 'Registration',
                        entityId: (int) $reg->id,
                        oldValues: ['registration_fee_snapshot' => null],
                        newValues: [
                            'registration_fee_snapshot' => $feeDecimal,
                            'reason' => $trimmedReason,
                        ],
                        actor: $actor
                    );
                }

                $confirmedIds[] = $id;
            }
        });

        return [
            'confirmed_count' => count($confirmedIds),
            'skipped_count' => count($skipped),
            'confirmed_ids' => $confirmedIds,
            'skipped' => $skipped,
        ];
    }

    /**
     * Build and verify chronological fee change history for a competition strictly from DB & activity_logs.
     *
     * @return array{
     *   complete: bool,
     *   reason: string,
     *   initial_fee: int|null,
     *   fee_changes: list<array{at: Carbon, log_id: int, old_fee: int, new_fee: int}>,
     *   current_fee: int|null
     * }
     */
    protected function analyzeCompetitionHistory(int $competitionId): array
    {
        $competition = Competition::withTrashed()->find($competitionId);
        if (! $competition) {
            return [
                'complete' => false,
                'reason' => 'Kompetisi induk tidak ditemukan.',
                'initial_fee' => null,
                'fee_changes' => [],
                'current_fee' => null,
            ];
        }

        try {
            $currentFee = MoneyHelper::parseWholeRupiahStrict((string) $competition->registration_fee);
        } catch (Throwable) {
            return [
                'complete' => false,
                'reason' => 'Nominal registration_fee kompetisi tidak valid.',
                'initial_fee' => null,
                'fee_changes' => [],
                'current_fee' => null,
            ];
        }

        $logs = ActivityLog::query()
            ->where('entity_type', 'Competition')
            ->where('entity_id', $competitionId)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $createLog = $logs->firstWhere('action', 'competition.create');
        if (! $createLog) {
            return [
                'complete' => false,
                'reason' => 'Histori activity_logs tidak memiliki log competition.create sebagai jangkar tarif awal.',
                'initial_fee' => null,
                'fee_changes' => [],
                'current_fee' => $currentFee,
            ];
        }

        $createFeeRaw = is_array($createLog->new_values) ? ($createLog->new_values['registration_fee'] ?? null) : null;
        if ($createFeeRaw === null) {
            return [
                'complete' => false,
                'reason' => 'Log competition.create tidak mencatat nominal registration_fee awal.',
                'initial_fee' => null,
                'fee_changes' => [],
                'current_fee' => $currentFee,
            ];
        }

        try {
            $cursorFee = MoneyHelper::parseWholeRupiahStrict(is_int($createFeeRaw) ? $createFeeRaw : (string) $createFeeRaw);
        } catch (Throwable) {
            return [
                'complete' => false,
                'reason' => 'Nominal registration_fee pada log competition.create tidak valid.',
                'initial_fee' => null,
                'fee_changes' => [],
                'current_fee' => $currentFee,
            ];
        }

        $initialFee = $cursorFee;
        $feeChanges = [];
        $lastEventAt = $createLog->created_at ? Carbon::parse($createLog->created_at) : null;

        foreach ($logs as $log) {
            if ($log->action !== 'competition.update') {
                continue;
            }

            if ($log->created_at === null || ($createLog->created_at !== null && $log->created_at->lt($createLog->created_at))) {
                return [
                    'complete' => false,
                    'reason' => 'Urutan timestamp log competition.update tidak konsisten terhadap competition.create.',
                    'initial_fee' => null,
                    'fee_changes' => [],
                    'current_fee' => $currentFee,
                ];
            }

            $oldRaw = is_array($log->old_values) ? ($log->old_values['registration_fee'] ?? null) : null;
            $newRaw = is_array($log->new_values) ? ($log->new_values['registration_fee'] ?? null) : null;

            if ($oldRaw === null || $newRaw === null) {
                return [
                    'complete' => false,
                    'reason' => "Log competition.update #{$log->id} tidak memuat old/new registration_fee yang lengkap.",
                    'initial_fee' => null,
                    'fee_changes' => [],
                    'current_fee' => $currentFee,
                ];
            }

            try {
                $oldFee = MoneyHelper::parseWholeRupiahStrict(is_int($oldRaw) ? $oldRaw : (string) $oldRaw);
                $newFee = MoneyHelper::parseWholeRupiahStrict(is_int($newRaw) ? $newRaw : (string) $newRaw);
            } catch (Throwable) {
                return [
                    'complete' => false,
                    'reason' => "Nominal pada log competition.update #{$log->id} tidak valid.",
                    'initial_fee' => null,
                    'fee_changes' => [],
                    'current_fee' => $currentFee,
                ];
            }

            if ($oldFee !== $cursorFee) {
                return [
                    'complete' => false,
                    'reason' => "Rantai perubahan biaya terputus pada log #{$log->id} (expected {$cursorFee}, logged old_fee {$oldFee}).",
                    'initial_fee' => null,
                    'fee_changes' => [],
                    'current_fee' => $currentFee,
                ];
            }

            $logAt = Carbon::parse($log->created_at);
            if ($newFee !== $cursorFee) {
                $feeChanges[] = [
                    'at' => $logAt,
                    'log_id' => (int) $log->id,
                    'old_fee' => $oldFee,
                    'new_fee' => $newFee,
                ];
            }

            $cursorFee = $newFee;
            $lastEventAt = $logAt;
        }

        if ($cursorFee !== $currentFee) {
            return [
                'complete' => false,
                'reason' => "Biaya akhir pada rantai log ({$cursorFee}) tidak cocok dengan biaya kompetisi saat ini ({$currentFee}).",
                'initial_fee' => null,
                'fee_changes' => [],
                'current_fee' => $currentFee,
            ];
        }

        if ($competition->updated_at !== null && $lastEventAt !== null) {
            // Allow at most 1 second variance for timestamp formatting/commit boundaries
            if ($competition->updated_at->gt($lastEventAt->copy()->addSecond())) {
                return [
                    'complete' => false,
                    'reason' => 'Timestamp updated_at kompetisi lebih baru daripada log perubahan terakhir (indikasi mutasi di luar ActivityLog).',
                    'initial_fee' => null,
                    'fee_changes' => [],
                    'current_fee' => $currentFee,
                ];
            }
        }

        return [
            'complete' => true,
            'reason' => 'Histori activity_logs utuh dan terverifikasi.',
            'initial_fee' => $initialFee,
            'fee_changes' => $feeChanges,
            'current_fee' => $currentFee,
        ];
    }

    /**
     * Resolve deterministic snapshot fee for a single registration or mark ambiguous.
     *
     * @param  array{
     *   complete: bool,
     *   reason: string,
     *   initial_fee: int|null,
     *   fee_changes: list<array{at: Carbon, log_id: int, old_fee: int, new_fee: int}>,
     *   current_fee: int|null
     * }  $history
     * @return array{resolved: true, fee_rupiah: int, evidence: string}|array{resolved: false, reason: string}
     */
    protected function resolveRegistrationSnapshot(Registration $registration, array $history): array
    {
        if (! $history['complete']) {
            return [
                'resolved' => false,
                'reason' => $history['reason'],
            ];
        }

        if ($registration->created_at === null) {
            return [
                'resolved' => false,
                'reason' => 'Timestamp created_at registrasi tidak tersedia.',
            ];
        }

        $regAt = Carbon::parse($registration->created_at);
        $feeChanges = $history['fee_changes'];

        // Check boundary collision: fee changed on the exact second registration was created
        foreach ($feeChanges as $change) {
            if ($change['at']->equalTo($regAt)) {
                return [
                    'resolved' => false,
                    'reason' => "Perubahan biaya (log #{$change['log_id']}) terjadi pada detik yang sama dengan pendaftaran.",
                ];
            }
        }

        // Determine fee strictly at $regAt from chronological change history (Tier 2)
        $firstChangeAfterReg = null;
        foreach ($feeChanges as $change) {
            if ($change['at']->gt($regAt)) {
                $firstChangeAfterReg = $change;
                break;
            }
        }

        $feeAtRegistration = $firstChangeAfterReg !== null
            ? $firstChangeAfterReg['old_fee']
            : (int) $history['current_fee'];

        $evidence = $firstChangeAfterReg !== null
            ? "tier2_log_before_change_#{$firstChangeAfterReg['log_id']}"
            : 'tier2_unchanged_since_create_log';

        // Tier 1 Corrected: inspect payments across ALL statuses.
        // Only treat payment.amount as supporting corroboration when ZERO fee changes occurred
        // inside [reg.created_at, payment.created_at]. If a change occurred inside that range,
        // IGNORE payment.amount cleanly and keep Tier 2 (or fail if payments mismatch without explanation).
        foreach ($registration->payments as $payment) {
            $paymentAt = $payment->created_at ? Carbon::parse($payment->created_at) : null;

            try {
                $paymentAmountRupiah = MoneyHelper::parseWholeRupiahStrict((string) $payment->amount);
            } catch (Throwable) {
                return [
                    'resolved' => false,
                    'reason' => "Nominal payment #{$payment->id} tidak valid.",
                ];
            }

            if ($paymentAt === null) {
                return [
                    'resolved' => false,
                    'reason' => "Payment #{$payment->id} tidak memiliki created_at untuk verifikasi rentang perubahan harga.",
                ];
            }

            $feeChangedBetweenRegAndPayment = false;
            foreach ($feeChanges as $change) {
                if ($change['at']->betweenIncluded($regAt, $paymentAt)) {
                    $feeChangedBetweenRegAndPayment = true;
                    break;
                }
            }

            if (! $feeChangedBetweenRegAndPayment) {
                if ($paymentAmountRupiah !== $feeAtRegistration) {
                    return [
                        'resolved' => false,
                        'reason' => "Nominal payment #{$payment->id} ({$paymentAmountRupiah}) bertentangan dengan histori biaya ({$feeAtRegistration}) tanpa perubahan harga di antara keduanya.",
                    ];
                }

                $evidence = "tier1_payment_corroborated_#{$payment->id}+{$evidence}";
            }
        }

        return [
            'resolved' => true,
            'fee_rupiah' => $feeAtRegistration,
            'evidence' => $evidence,
        ];
    }
}
