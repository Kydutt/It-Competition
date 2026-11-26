<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Exceptions\PaymentException;
use App\Models\Event;
use App\Models\EventSetting;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\User;
use App\Support\MoneyHelper;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Throwable;

class PaymentService
{
    public function __construct(
        protected MidtransService $midtransService
    ) {}

    /**
     * Determine if payment module is enabled for the given event (or latest event).
     */
    public function isPaymentEnabled(?int $eventId = null): bool
    {
        $targetEventId = $eventId ?? Event::latest('id')->value('id');
        if (! $targetEventId) {
            return false;
        }

        $rawValue = EventSetting::where('event_id', $targetEventId)
            ->where('setting_key', 'payment_enabled')
            ->value('setting_value');

        return in_array(strtolower(trim((string) $rawValue)), ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * Get public payment configuration for frontend initialization.
     *
     * @return array{payment_enabled: bool, client_key: string, snap_script_url: string, is_production: bool}
     */
    public function getPublicPaymentConfig(?int $eventId = null): array
    {
        $enabled = $this->isPaymentEnabled($eventId);
        $midtransConfig = $this->midtransService->getPublicConfig();

        return [
            'payment_enabled' => $enabled,
            'client_key' => $enabled ? $midtransConfig['client_key'] : '',
            'snap_script_url' => $midtransConfig['snap_script_url'],
            'is_production' => $midtransConfig['is_production'],
        ];
    }

    /**
     * Create a new Midtrans Snap payment or reuse an active pending Snap transaction.
     *
     * Business Rules Enforced:
     * - PD-01: Registration must be submitted / under_review (not draft, approved, rejected, cancelled).
     * - PD-05: Only individual registrant or team leader can initiate payment.
     * - PD-06: Expiry is 24 hours (1440 mins) or competition registration_deadline, whichever comes first.
     * - PD-07: Controlled by event_settings.payment_enabled; rejects if disabled.
     * - Server-authoritative amount derived strictly from registrations.registration_fee_snapshot.
     *
     * @return array{payment: Payment, created: bool}
     */
    public function createOrReuseSnapPayment(User $user, Registration $registration): array
    {
        $registration->loadMissing(['competition.event', 'team', 'participant']);
        $competition = $registration->competition;

        if (! $competition) {
            throw new PaymentException('Kompetisi untuk pendaftaran ini tidak ditemukan.', 404);
        }

        // PD-07: Reject if payment module is disabled
        if (! $this->isPaymentEnabled($competition->event_id)) {
            throw new PaymentException('Modul pembayaran saat ini sedang dinonaktifkan.', 409);
        }

        // PD-05: Ownership & team leader check
        if (! $this->canInitiatePayment($user, $registration)) {
            throw new AuthorizationException(
                'Hanya peserta pemilik atau ketua tim yang berhak membuat transaksi pembayaran untuk pendaftaran ini.'
            );
        }

        // PD-01: Must be submitted or under_review (after submit, before final approval/decision)
        if (! in_array($registration->status, [RegistrationStatus::SUBMITTED, RegistrationStatus::UNDER_REVIEW], true)) {
            throw new PaymentException(
                'Pembayaran hanya dapat dilakukan setelah pendaftaran dikirim (submitted) dan sebelum keputusan akhir panitia.',
                409
            );
        }

        return DB::transaction(function () use ($user, $registration) {
            // Lock registration row to prevent concurrent duplicate Snap creations (monotonic hierarchy: registrations -> payments)
            $regQuery = Registration::where('id', $registration->id)->with(['competition', 'team', 'participant']);
            if (DB::connection()->getDriverName() !== 'sqlite') {
                $regQuery->lockForUpdate();
            }
            $lockedRegistration = $regQuery->firstOrFail();
            $lockedCompetition = $lockedRegistration->competition;

            if (! $lockedCompetition) {
                throw new PaymentException('Kompetisi untuk pendaftaran ini tidak ditemukan.', 404);
            }

            if (! in_array($lockedRegistration->status, [RegistrationStatus::SUBMITTED, RegistrationStatus::UNDER_REVIEW], true)) {
                throw new PaymentException(
                    'Pembayaran hanya dapat dilakukan setelah pendaftaran dikirim (submitted) dan sebelum keputusan akhir panitia.',
                    409
                );
            }

            try {
                $feeRupiah = $lockedRegistration->effectiveRegistrationFeeRupiah();
            } catch (InvalidArgumentException $e) {
                throw ValidationException::withMessages([
                    'registration' => [$e->getMessage()],
                ]);
            }

            if ($feeRupiah === null) {
                throw ValidationException::withMessages([
                    'registration' => ['Biaya pendaftaran historis untuk registrasi ini belum terkonfirmasi. Silakan hubungi panitia untuk verifikasi sebelum melakukan pembayaran.'],
                ]);
            }

            if ($feeRupiah <= 0) {
                throw ValidationException::withMessages([
                    'registration' => ['Kompetisi ini gratis dan tidak memerlukan pembayaran.'],
                ]);
            }

            // Prevent creating new transaction if already paid/verified
            $hasPaid = Payment::where('registration_id', $lockedRegistration->id)
                ->whereIn('status', [PaymentStatus::PAID->value, PaymentStatus::VERIFIED->value])
                ->exists();

            if ($hasPaid) {
                throw new PaymentException(
                    'Pendaftaran ini sudah memiliki transaksi pembayaran yang lunas.',
                    409
                );
            }

            // PD-06: Expiry = min(now + configured minutes, registration_deadline)
            $expiredAt = $this->calculateExpiryTime($lockedCompetition->registration_deadline);
            if ($expiredAt->lte(now())) {
                throw ValidationException::withMessages([
                    'competition' => ['Batas waktu pendaftaran kompetisi telah berakhir sehingga transaksi baru tidak dapat dibuat.'],
                ]);
            }

            // Check existing pending transaction
            $existingPending = Payment::where('registration_id', $lockedRegistration->id)
                ->where('status', PaymentStatus::PENDING->value)
                ->latest('id')
                ->first();

            if ($existingPending) {
                $isExpired = $existingPending->expired_at !== null && $existingPending->expired_at->lte(now());
                $sameAmount = MoneyHelper::decimalToCents((string) $existingPending->amount) === ($feeRupiah * 100);

                if (! $isExpired && $sameAmount && ! empty($existingPending->snap_token)) {
                    return [
                        'payment' => $existingPending->load(['registration.competition', 'registration.team.leader', 'user']),
                        'created' => false,
                    ];
                }

                // Mark stale pending transaction cleanly before issuing a fresh order_id
                $existingPending->update([
                    'status' => $isExpired ? PaymentStatus::EXPIRED : PaymentStatus::CANCELLED,
                ]);
            }

            $orderId = $this->generateUniqueOrderId($lockedRegistration->id);
            $grossAmount = $feeRupiah;
            $durationMinutes = max(1, (int) ceil(now()->diffInSeconds($expiredAt) / 60));

            $user->loadMissing('profile');
            $snapPayload = [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => $grossAmount,
                ],
                'item_details' => [
                    [
                        'id' => 'COMP-' . $lockedCompetition->id,
                        'price' => $grossAmount,
                        'quantity' => 1,
                        'name' => $this->midtransService->sanitizeText('Pendaftaran ' . $lockedCompetition->name, 50),
                    ],
                ],
                'customer_details' => [
                    'first_name' => $this->midtransService->sanitizeText((string) $user->name, 50),
                    'email' => $user->email,
                    'phone' => (string) ($user->profile?->phone ?? ''),
                ],
                'expiry' => [
                    'start_time' => now()->format('Y-m-d H:i:s O'),
                    'unit' => 'minute',
                    'duration' => $durationMinutes,
                ],
            ];

            $snapResult = $this->midtransService->createSnapTransaction($snapPayload);

            $payment = Payment::create([
                'registration_id' => $lockedRegistration->id,
                'user_id' => $user->id,
                'order_id' => $orderId,
                'gateway' => 'midtrans',
                'amount' => MoneyHelper::rupiahToDecimalString($feeRupiah),
                'payment_method' => 'midtrans_snap',
                'snap_token' => $snapResult['token'],
                'snap_redirect_url' => $snapResult['redirect_url'] ?: null,
                'status' => PaymentStatus::PENDING,
                'expired_at' => $expiredAt,
            ]);

            ActivityLogService::log(
                action: 'payment.create',
                entityType: 'Payment',
                entityId: $payment->id,
                oldValues: null,
                newValues: [
                    'order_id' => $payment->order_id,
                    'registration_id' => $lockedRegistration->id,
                    'registration_number' => $lockedRegistration->registration_number,
                    'amount' => (string) $payment->amount,
                    'expired_at' => $expiredAt->toISOString(),
                ],
                actor: $user
            );

            return [
                'payment' => $payment->load(['registration.competition', 'registration.team.leader', 'user']),
                'created' => true,
            ];
        });
    }

    /**
     * Handle incoming Midtrans HTTP webhook notification safely and idempotently.
     *
     * @param  array<string, mixed>  $payload
     * @return array{payment: Payment, updated: bool, message: string}
     */
    public function handleWebhook(array $payload): array
    {
        $orderId = trim((string) ($payload['order_id'] ?? ''));
        $statusCode = trim((string) ($payload['status_code'] ?? ''));
        $grossAmount = trim((string) ($payload['gross_amount'] ?? ''));
        $signatureKey = trim((string) ($payload['signature_key'] ?? ''));

        if (! $this->midtransService->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey)) {
            Log::warning('Midtrans webhook signature verification failed', [
                'order_id' => $orderId,
                'status_code' => $statusCode,
                'ip' => request()->ip(),
            ]);

            throw new PaymentException('Signature notifikasi Midtrans tidak valid.', 403);
        }

        $registrationId = Payment::where('order_id', $orderId)->value('registration_id');

        try {
            $result = DB::transaction(function () use ($orderId, $registrationId, $grossAmount, $payload) {
                if ($registrationId !== null && DB::connection()->getDriverName() !== 'sqlite') {
                    // Lock Registration first (same hierarchy as createOrReuseSnapPayment)
                    // so concurrent webhooks for different order_ids on one registration serialize cleanly.
                    Registration::where('id', $registrationId)->lockForUpdate()->first();
                }

                $paymentQuery = Payment::where('order_id', $orderId);
                if (DB::connection()->getDriverName() !== 'sqlite') {
                    $paymentQuery->lockForUpdate();
                }

                $lockedPayment = $paymentQuery->first();

                if (! $lockedPayment) {
                    Log::warning('Midtrans webhook payment not found', [
                        'order_id' => $orderId,
                    ]);

                    throw new PaymentException('Transaksi pembayaran tidak ditemukan.', 404);
                }

                $this->assertMatchingAmount($lockedPayment, $grossAmount, 'webhook');

                return $this->applyMidtransStatusUpdate($lockedPayment, $payload, null, 'webhook');
            });
        } catch (QueryException $e) {
            if ($this->isSinglePaidConstraintViolation($e)) {
                $this->handleSinglePaidConstraintRollback($orderId, $payload, null, 'webhook');

                throw new PaymentException(
                    'Pendaftaran ini sudah memiliki transaksi pembayaran lunas.',
                    409,
                    $e
                );
            }

            throw $e;
        }

        if (! empty($result['conflict'])) {
            throw new PaymentException($result['message'], 409);
        }

        return $result;
    }

    /**
     * Reconcile a payment transaction status directly against Midtrans Status API.
     */
    public function syncPaymentStatusFromMidtrans(Payment $payment, ?User $actor = null): Payment
    {
        if (empty($payment->order_id)) {
            throw new PaymentException('Transaksi ini tidak memiliki order_id Midtrans yang valid.', 422);
        }

        $midtransData = $this->midtransService->getTransactionStatus($payment->order_id);

        $responseOrderId = trim((string) ($midtransData['order_id'] ?? ''));
        if ($responseOrderId !== '' && $responseOrderId !== $payment->order_id) {
            Log::critical('Midtrans status API order_id mismatch', [
                'payment_id' => $payment->id,
                'expected_order_id' => $payment->order_id,
                'received_order_id' => $responseOrderId,
            ]);

            throw new PaymentException('Respons status Midtrans tidak cocok dengan transaksi ini.', 502);
        }

        $this->assertMatchingAmount($payment, $midtransData['gross_amount'] ?? null, 'sync');

        try {
            $result = DB::transaction(function () use ($payment, $midtransData, $actor) {
                if (DB::connection()->getDriverName() !== 'sqlite') {
                    Registration::where('id', $payment->registration_id)->lockForUpdate()->first();
                }

                $paymentQuery = Payment::where('id', $payment->id);
                if (DB::connection()->getDriverName() !== 'sqlite') {
                    $paymentQuery->lockForUpdate();
                }

                $lockedPayment = $paymentQuery->firstOrFail();
                $this->assertMatchingAmount($lockedPayment, $midtransData['gross_amount'] ?? null, 'sync');

                return $this->applyMidtransStatusUpdate($lockedPayment, $midtransData, $actor, 'sync');
            });
        } catch (QueryException $e) {
            if ($this->isSinglePaidConstraintViolation($e)) {
                $this->handleSinglePaidConstraintRollback((string) $payment->order_id, $midtransData, $actor, 'sync');

                throw new PaymentException(
                    'Pendaftaran ini sudah memiliki transaksi pembayaran lunas.',
                    409,
                    $e
                );
            }

            throw $e;
        }

        if (! empty($result['conflict'])) {
            throw new PaymentException($result['message'], 409);
        }

        return $result['payment']->load(['registration.competition', 'registration.team.leader', 'user']);
    }

    /**
     * Apply validated Midtrans notification/status payload inside an active DB transaction.
     *
     * @param  array<string, mixed>  $payload
     * @return array{payment: Payment, updated: bool, message: string}
     */
    protected function applyMidtransStatusUpdate(
        Payment $payment,
        array $payload,
        ?User $actor,
        string $source
    ): array {
        $rawStatus = strtolower(trim((string) ($payload['transaction_status'] ?? '')));
        $fraudStatus = isset($payload['fraud_status']) && $payload['fraud_status'] !== ''
            ? strtolower(trim((string) $payload['fraud_status']))
            : null;

        $targetStatus = $this->mapMidtransStatus($rawStatus, $fraudStatus);

        if ($targetStatus === null) {
            Log::warning('Midtrans payload contained unsupported transaction_status', [
                'payment_id' => $payment->id,
                'order_id' => $payment->order_id,
                'transaction_status' => $rawStatus,
                'fraud_status' => $fraudStatus,
                'source' => $source,
            ]);

            return [
                'payment' => $payment,
                'updated' => false,
                'message' => 'Status transaksi tidak dikenal; diabaikan secara aman.',
            ];
        }

        $currentStatus = $payment->status instanceof PaymentStatus
            ? $payment->status
            : PaymentStatus::from((string) $payment->status);

        $isPostSettlementReversal = in_array($rawStatus, ['refund', 'partial_refund', 'chargeback', 'partial_chargeback'], true);

        if ($isPostSettlementReversal) {
            return $this->handlePostSettlementReversal(
                $payment,
                $currentStatus,
                $rawStatus,
                $fraudStatus,
                $payload,
                $actor,
                $source
            );
        }

        // Idempotency & out-of-order protection: finalized transactions cannot be overwritten
        // by duplicate deliveries or late stale notifications (pending/expire/cancel/etc.).
        if ($currentStatus->isFinal()) {
            if ($targetStatus === PaymentStatus::PAID && ! $currentStatus->isPaid()) {
                Log::warning('Midtrans settlement notification ignored because local payment is already finalized non-paid', [
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'current_status' => $currentStatus->value,
                    'incoming_transaction_status' => $rawStatus,
                    'source' => $source,
                ]);
            } elseif (! $currentStatus->isPaid() || $targetStatus !== PaymentStatus::PAID) {
                Log::info('Midtrans out-of-order or duplicate notification ignored for finalized payment', [
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'current_status' => $currentStatus->value,
                    'incoming_status' => $targetStatus->value,
                    'incoming_transaction_status' => $rawStatus,
                    'source' => $source,
                ]);
            }

            return [
                'payment' => $payment,
                'updated' => false,
                'message' => 'Notifikasi diabaikan secara idempotent karena status transaksi sudah final.',
            ];
        }

        // Stay pending when provider is still pending or capture is under fraud challenge
        if ($targetStatus === PaymentStatus::PENDING) {
            $isSameMetadata = $payment->midtrans_transaction_status === $rawStatus
                && $payment->fraud_status === $fraudStatus
                && ($payload['transaction_id'] ?? $payment->midtrans_transaction_id) === $payment->midtrans_transaction_id
                && ($payload['payment_type'] ?? $payment->payment_type) === $payment->payment_type;

            if ($isSameMetadata) {
                return [
                    'payment' => $payment,
                    'updated' => false,
                    'message' => 'Notifikasi status pending duplikat diabaikan secara idempotent.',
                ];
            }

            $payment->update([
                'payment_type' => $payload['payment_type'] ?? $payment->payment_type,
                'midtrans_transaction_id' => $payload['transaction_id'] ?? $payment->midtrans_transaction_id,
                'midtrans_transaction_status' => $rawStatus,
                'fraud_status' => $fraudStatus,
                'webhook_payload' => $this->sanitizeWebhookPayload($payload),
                'last_webhook_at' => $source === 'webhook' ? now() : $payment->last_webhook_at,
            ]);

            if ($rawStatus === 'capture' && $fraudStatus === 'challenge') {
                Log::warning('Midtrans capture transaction under fraud challenge; keeping pending', [
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'source' => $source,
                ]);

                ActivityLogService::log(
                    action: 'payment.fraud_challenge',
                    entityType: 'Payment',
                    entityId: $payment->id,
                    oldValues: ['status' => $currentStatus->value],
                    newValues: [
                        'status' => PaymentStatus::PENDING->value,
                        'midtrans_transaction_status' => $rawStatus,
                        'fraud_status' => $fraudStatus,
                        'source' => $source,
                    ],
                    actor: $actor
                );
            }

            return [
                'payment' => $payment->fresh(),
                'updated' => true,
                'message' => 'Metadata status pembayaran diperbarui dan masih menunggu konfirmasi.',
            ];
        }

        // Enforce single paid transaction per registration before promoting to PAID
        if ($targetStatus === PaymentStatus::PAID) {
            $otherPaidExists = Payment::where('registration_id', $payment->registration_id)
                ->where('id', '!=', $payment->id)
                ->whereIn('status', [PaymentStatus::PAID->value, PaymentStatus::VERIFIED->value])
                ->exists();

            if ($otherPaidExists) {
                return $this->recordDuplicatePaidConflict($payment, $rawStatus, $fraudStatus, $payload, $actor, $source);
            }
        }

        $previousProviderStatus = $payment->midtrans_transaction_status;

        $paidAt = $payment->paid_at;
        if ($targetStatus === PaymentStatus::PAID && $paidAt === null) {
            $paidAt = $this->parseMidtransTime($payload['settlement_time'] ?? $payload['transaction_time'] ?? null) ?? now();
        }

        $payment->update([
            'status' => $targetStatus,
            'payment_type' => $payload['payment_type'] ?? $payment->payment_type,
            'midtrans_transaction_id' => $payload['transaction_id'] ?? $payment->midtrans_transaction_id,
            'midtrans_transaction_status' => $rawStatus,
            'fraud_status' => $fraudStatus ?? $payment->fraud_status,
            'paid_at' => $paidAt,
            'webhook_payload' => $this->sanitizeWebhookPayload($payload),
            'last_webhook_at' => $source === 'webhook' ? now() : $payment->last_webhook_at,
        ]);

        ActivityLogService::log(
            action: 'payment.status_updated',
            entityType: 'Payment',
            entityId: $payment->id,
            oldValues: [
                'status' => $currentStatus->value,
                'midtrans_transaction_status' => $previousProviderStatus,
            ],
            newValues: [
                'order_id' => $payment->order_id,
                'status' => $targetStatus->value,
                'midtrans_transaction_status' => $rawStatus,
                'fraud_status' => $fraudStatus,
                'payment_type' => $payment->payment_type,
                'source' => $source,
            ],
            actor: $actor
        );

        $this->notifyPaymentStatusChange($payment, $targetStatus, $rawStatus);

        return [
            'payment' => $payment->fresh(),
            'updated' => true,
            'message' => 'Status pembayaran berhasil diperbarui.',
        ];
    }

    /**
     * Record a duplicate paid-settlement conflict non-destructively and signal 409 Conflict.
     *
     * @param  array<string, mixed>  $payload
     * @return array{payment: Payment, updated: bool, conflict: bool, message: string}
     */
    protected function recordDuplicatePaidConflict(
        Payment $payment,
        string $rawStatus,
        ?string $fraudStatus,
        array $payload,
        ?User $actor,
        string $source
    ): array {
        $previousStatus = $payment->status instanceof PaymentStatus
            ? $payment->status->value
            : (string) $payment->status;
        $previousProviderStatus = $payment->midtrans_transaction_status;

        $sanitizedPayload = $this->sanitizeWebhookPayload($payload);
        $sanitizedPayload['conflict_reason'] = 'duplicate_paid_blocked';

        $reason = 'Dibatalkan karena pendaftaran sudah memiliki transaksi pembayaran lunas yang berbeda.';

        $payment->update([
            'status' => PaymentStatus::CANCELLED,
            'payment_type' => $payload['payment_type'] ?? $payment->payment_type,
            'midtrans_transaction_id' => $payload['transaction_id'] ?? $payment->midtrans_transaction_id,
            'midtrans_transaction_status' => $rawStatus,
            'fraud_status' => $fraudStatus ?? $payment->fraud_status,
            'rejection_reason' => $reason,
            'webhook_payload' => $sanitizedPayload,
            'last_webhook_at' => $source === 'webhook' ? now() : $payment->last_webhook_at,
        ]);

        Log::critical('Blocked second paid payment for registration', [
            'registration_id' => $payment->registration_id,
            'payment_id' => $payment->id,
            'order_id' => $payment->order_id,
            'source' => $source,
        ]);

        ActivityLogService::log(
            action: 'payment.duplicate_paid_blocked',
            entityType: 'Payment',
            entityId: $payment->id,
            oldValues: [
                'status' => $previousStatus,
                'midtrans_transaction_status' => $previousProviderStatus,
            ],
            newValues: [
                'order_id' => $payment->order_id,
                'status' => PaymentStatus::CANCELLED->value,
                'midtrans_transaction_status' => $rawStatus,
                'reason' => $reason,
                'source' => $source,
            ],
            actor: $actor
        );

        return [
            'payment' => $payment->fresh(),
            'updated' => true,
            'conflict' => true,
            'message' => 'Pendaftaran ini sudah memiliki transaksi pembayaran lunas.',
        ];
    }

    /**
     * Detect MySQL unique constraint violation on paid_registration_id (or SQLite fallback).
     */
    protected function isSinglePaidConstraintViolation(QueryException $e): bool
    {
        $sqlState = (string) ($e->errorInfo[0] ?? $e->getCode());
        $driverCode = (int) ($e->errorInfo[1] ?? 0);
        $message = $e->getMessage();

        if (str_contains($message, 'uq_payment_single_paid_registration')
            || str_contains($message, 'paid_registration_id')) {
            return true;
        }

        return $sqlState === '23000' && in_array($driverCode, [1062, 19], true);
    }

    /**
     * Persist conflict audit state cleanly after a unique-constraint rollback.
     *
     * @param  array<string, mixed>  $payload
     */
    protected function handleSinglePaidConstraintRollback(
        string $orderId,
        array $payload,
        ?User $actor,
        string $source
    ): void {
        if ($orderId === '') {
            return;
        }

        $payment = Payment::where('order_id', $orderId)->first();
        if (! $payment || ($payment->status instanceof PaymentStatus && $payment->status->isPaid())) {
            return;
        }

        $rawStatus = strtolower(trim((string) ($payload['transaction_status'] ?? 'settlement')));
        $fraudStatus = isset($payload['fraud_status']) && $payload['fraud_status'] !== ''
            ? strtolower(trim((string) $payload['fraud_status']))
            : null;

        DB::transaction(function () use ($payment, $rawStatus, $fraudStatus, $payload, $actor, $source) {
            $locked = Payment::where('id', $payment->id);
            if (DB::connection()->getDriverName() !== 'sqlite') {
                $locked->lockForUpdate();
            }

            $fresh = $locked->first();
            if ($fresh && ! ($fresh->status instanceof PaymentStatus && $fresh->status->isPaid())) {
                $this->recordDuplicatePaidConflict($fresh, $rawStatus, $fraudStatus, $payload, $actor, $source);
            }
        });
    }

    /**
     * Explicitly handle refund, partial_refund, chargeback, and partial_chargeback
     * with traceable amounts, cumulative net balance evaluation, and preserved transaction history.
     *
     * @param  array<string, mixed>  $payload
     * @return array{payment: Payment, updated: bool, message: string}
     */
    protected function handlePostSettlementReversal(
        Payment $payment,
        PaymentStatus $currentStatus,
        string $rawStatus,
        ?string $fraudStatus,
        array $payload,
        ?User $actor,
        string $source
    ): array {
        $existingPayload = is_array($payment->webhook_payload) ? $payment->webhook_payload : [];
        $history = is_array($existingPayload['reversal_history'] ?? null)
            ? $existingPayload['reversal_history']
            : [];

        $refundKey = isset($payload['refund_key']) && trim((string) $payload['refund_key']) !== ''
            ? trim((string) $payload['refund_key'])
            : null;
        $chargebackId = isset($payload['refund_chargeback_id']) && trim((string) $payload['refund_chargeback_id']) !== ''
            ? trim((string) $payload['refund_chargeback_id'])
            : null;

        $grossCents = MoneyHelper::decimalToCents((string) $payment->amount);
        $priorRefundedCents = MoneyHelper::decimalToCents((string) ($existingPayload['cumulative_refunded_amount'] ?? '0'));

        $eventRefundCents = null;
        if (array_key_exists('refund_amount', $payload) && $payload['refund_amount'] !== null && $payload['refund_amount'] !== '') {
            if (! is_scalar($payload['refund_amount'])) {
                throw new PaymentException('Nominal refund pada notifikasi tidak valid.', 422);
            }
            try {
                $eventRefundCents = MoneyHelper::decimalToCents(is_int($payload['refund_amount']) ? $payload['refund_amount'] : (string) $payload['refund_amount']);
            } catch (InvalidArgumentException) {
                throw new PaymentException('Nominal refund pada notifikasi tidak valid.', 422);
            }
        } elseif (in_array($rawStatus, ['refund', 'chargeback'], true)) {
            $eventRefundCents = max(0, $grossCents - $priorRefundedCents);
        }

        $eventRefundAmount = $eventRefundCents !== null ? MoneyHelper::centsToNumericAmount($eventRefundCents) : null;
        $priorRefunded = MoneyHelper::centsToNumericAmount($priorRefundedCents);

        // Deduplicate idempotently: distinct refund_key / refund_chargeback_id represents a new event,
        // whereas replaying the same key or identical state without keys is an idempotent no-op.
        if ($refundKey !== null || $chargebackId !== null) {
            foreach ($history as $entry) {
                if (! is_array($entry)) {
                    continue;
                }
                $sameType = ($entry['type'] ?? null) === $rawStatus;
                $sameKey = $refundKey === null || ($entry['refund_key'] ?? null) === $refundKey;
                $sameCbId = $chargebackId === null || ($entry['refund_chargeback_id'] ?? null) === $chargebackId;
                if ($sameType && $sameKey && $sameCbId) {
                    return [
                        'payment' => $payment,
                        'updated' => false,
                        'message' => 'Notifikasi reversal duplikat diabaikan secara idempotent.',
                    ];
                }
            }
        } elseif ($payment->midtrans_transaction_status === $rawStatus && $history !== []) {
            $lastEntry = end($history);
            if (is_array($lastEntry)
                && ($lastEntry['type'] ?? null) === $rawStatus
                && ($lastEntry['refund_amount'] ?? null) === $eventRefundAmount
            ) {
                return [
                    'payment' => $payment,
                    'updated' => false,
                    'message' => 'Notifikasi reversal duplikat diabaikan secara idempotent.',
                ];
            }
        }

        $isPartialEvent = in_array($rawStatus, ['partial_refund', 'partial_chargeback'], true);
        $cumulativeRefundedCents = $eventRefundCents !== null
            ? min($grossCents, $priorRefundedCents + $eventRefundCents)
            : $priorRefundedCents;

        $netPaidCents = ($isPartialEvent && $eventRefundCents === null)
            ? null
            : max(0, $grossCents - $cumulativeRefundedCents);

        $cumulativeRefunded = MoneyHelper::centsToNumericAmount($cumulativeRefundedCents);
        $netPaidAmount = $netPaidCents !== null ? MoneyHelper::centsToNumericAmount($netPaidCents) : null;

        $payment->loadMissing('registration');
        $snapshotRupiah = $payment->registration?->effectiveRegistrationFeeRupiah();
        $requiredFeeCents = $snapshotRupiah !== null ? ($snapshotRupiah * 100) : $grossCents;
        $requiredFee = MoneyHelper::centsToNumericAmount($requiredFeeCents);

        if (in_array($rawStatus, ['chargeback', 'partial_chargeback'], true)) {
            $targetStatus = PaymentStatus::FAILED;
            $reason = $rawStatus === 'partial_chargeback'
                ? sprintf(
                    'Pembayaran mengalami partial_chargeback dari penerbit (dispute: Rp %s, sisa bersih: %s). Pendaftaran tidak memenuhi syarat lunas.',
                    $eventRefundCents !== null ? MoneyHelper::formatCentsForDisplay($eventRefundCents) : 'tidak diketahui',
                    $netPaidCents !== null ? 'Rp ' . MoneyHelper::formatCentsForDisplay($netPaidCents) : 'tidak diketahui'
                )
                : 'Pembayaran mengalami chargeback penuh dari penerbit atau payment gateway. Pendaftaran tidak memenuhi syarat lunas.';
        } elseif ($rawStatus === 'partial_refund') {
            if ($netPaidCents !== null && $netPaidCents > 0 && ($requiredFeeCents <= 0 || $netPaidCents >= $requiredFeeCents)) {
                $targetStatus = PaymentStatus::PAID;
                $reason = sprintf(
                    'Partial refund Rp %s dicatat; nominal bersih Rp %s masih mencukupi biaya pendaftaran (Rp %s).',
                    MoneyHelper::formatCentsForDisplay((int) $eventRefundCents),
                    MoneyHelper::formatCentsForDisplay($netPaidCents),
                    MoneyHelper::formatCentsForDisplay($requiredFeeCents)
                );
            } elseif ($netPaidCents !== null && $netPaidCents <= 0) {
                $targetStatus = PaymentStatus::CANCELLED;
                $reason = sprintf(
                    'Akumulasi partial refund mencapai total pembayaran (Rp %s); transaksi dibatalkan penuh.',
                    MoneyHelper::formatCentsForDisplay($cumulativeRefundedCents)
                );
            } else {
                $targetStatus = PaymentStatus::REJECTED;
                $reason = sprintf(
                    'Pembayaran mengalami partial_refund (%s); sisa nominal bersih (%s) di bawah biaya pendaftaran (Rp %s).',
                    $eventRefundCents !== null ? 'Rp ' . MoneyHelper::formatCentsForDisplay($eventRefundCents) : 'nominal tidak disertakan',
                    $netPaidCents !== null ? 'Rp ' . MoneyHelper::formatCentsForDisplay($netPaidCents) : 'tidak diketahui',
                    MoneyHelper::formatCentsForDisplay($requiredFeeCents)
                );
            }
        } else {
            $targetStatus = PaymentStatus::CANCELLED;
            $reason = sprintf(
                'Pembayaran mengalami pengembalian dana penuh (refund: Rp %s). Pendaftaran tidak lagi berstatus lunas.',
                MoneyHelper::formatCentsForDisplay($eventRefundCents ?? $grossCents)
            );
        }

        $history[] = [
            'type' => $rawStatus,
            'refund_key' => $refundKey,
            'refund_chargeback_id' => $chargebackId,
            'refund_amount' => $eventRefundAmount,
            'cumulative_refunded_amount' => $cumulativeRefunded,
            'net_paid_amount' => $netPaidAmount,
            'transaction_id' => $payload['transaction_id'] ?? $payment->midtrans_transaction_id,
            'recorded_at' => now()->toISOString(),
            'source' => $source,
        ];

        $sanitizedPayload = $this->sanitizeWebhookPayload($payload);
        $sanitizedPayload['cumulative_refunded_amount'] = $cumulativeRefunded;
        $sanitizedPayload['net_paid_amount'] = $netPaidAmount;
        $sanitizedPayload['reversal_history'] = $history;

        $previousProviderStatus = $payment->midtrans_transaction_status;

        $payment->update([
            'status' => $targetStatus,
            'payment_type' => $payload['payment_type'] ?? $payment->payment_type,
            'midtrans_transaction_id' => $payload['transaction_id'] ?? $payment->midtrans_transaction_id,
            'midtrans_transaction_status' => $rawStatus,
            'fraud_status' => $fraudStatus ?? $payment->fraud_status,
            'rejection_reason' => $reason,
            'webhook_payload' => $sanitizedPayload,
            'last_webhook_at' => $source === 'webhook' ? now() : $payment->last_webhook_at,
        ]);

        Log::warning('Midtrans post-settlement reversal handled explicitly', [
            'payment_id' => $payment->id,
            'order_id' => $payment->order_id,
            'old_status' => $currentStatus->value,
            'new_status' => $targetStatus->value,
            'midtrans_transaction_status' => $rawStatus,
            'refund_amount' => $eventRefundAmount,
            'cumulative_refunded_amount' => $cumulativeRefunded,
            'net_paid_amount' => $netPaidAmount,
            'eligibility_retained' => $targetStatus->isPaid(),
            'source' => $source,
        ]);

        ActivityLogService::log(
            action: 'payment.' . $rawStatus,
            entityType: 'Payment',
            entityId: $payment->id,
            oldValues: [
                'status' => $currentStatus->value,
                'midtrans_transaction_status' => $previousProviderStatus,
                'cumulative_refunded_amount' => $priorRefunded,
            ],
            newValues: [
                'order_id' => $payment->order_id,
                'status' => $targetStatus->value,
                'midtrans_transaction_status' => $rawStatus,
                'refund_key' => $refundKey,
                'refund_chargeback_id' => $chargebackId,
                'refund_amount' => $eventRefundAmount,
                'cumulative_refunded_amount' => $cumulativeRefunded,
                'net_paid_amount' => $netPaidAmount,
                'required_fee' => $requiredFee,
                'eligibility_retained' => $targetStatus->isPaid(),
                'reason' => $reason,
                'source' => $source,
            ],
            actor: $actor
        );

        $this->notifyPaymentStatusChange($payment, $targetStatus, $rawStatus, [
            'refund_amount' => $eventRefundAmount,
            'cumulative_refunded_amount' => $cumulativeRefunded,
            'net_paid_amount' => $netPaidAmount,
        ]);

        return [
            'payment' => $payment->fresh(),
            'updated' => true,
            'message' => 'Status reversal pembayaran berhasil dicatat tanpa menghapus histori transaksi.',
        ];
    }

    /**
     * Map Midtrans transaction_status & fraud_status to canonical internal PaymentStatus.
     */
    public function mapMidtransStatus(string $transactionStatus, ?string $fraudStatus = null): ?PaymentStatus
    {
        $status = strtolower(trim($transactionStatus));
        $fraud = $fraudStatus !== null ? strtolower(trim($fraudStatus)) : null;

        return match ($status) {
            'capture' => match ($fraud) {
                'accept' => PaymentStatus::PAID,
                'deny' => PaymentStatus::FAILED,
                default => PaymentStatus::PENDING,
            },
            'settlement' => match ($fraud) {
                'deny' => PaymentStatus::FAILED,
                'challenge' => PaymentStatus::PENDING,
                default => PaymentStatus::PAID,
            },
            'pending' => PaymentStatus::PENDING,
            'expire' => PaymentStatus::EXPIRED,
            'cancel' => PaymentStatus::CANCELLED,
            'deny', 'failure' => PaymentStatus::FAILED,
            'refund' => PaymentStatus::CANCELLED,
            'partial_refund' => PaymentStatus::REJECTED,
            'chargeback', 'partial_chargeback' => PaymentStatus::FAILED,
            default => null,
        };
    }

    /**
     * Validate incoming gross_amount against stored authoritative payment amount.
     */
    protected function assertMatchingAmount(Payment $payment, mixed $rawGrossAmount, string $source): void
    {
        if (! is_scalar($rawGrossAmount)) {
            Log::critical('Midtrans payload missing or non-scalar gross_amount', [
                'payment_id' => $payment->id,
                'order_id' => $payment->order_id,
                'source' => $source,
            ]);

            throw new PaymentException('Nominal pembayaran dari Midtrans tidak valid.', 422);
        }

        try {
            $incomingCents = MoneyHelper::decimalToCents(is_int($rawGrossAmount) ? $rawGrossAmount : (string) $rawGrossAmount);
            $expectedCents = MoneyHelper::decimalToCents((string) $payment->amount);
        } catch (InvalidArgumentException) {
            Log::critical('Midtrans payload non-numeric or invalid gross_amount', [
                'payment_id' => $payment->id,
                'order_id' => $payment->order_id,
                'source' => $source,
            ]);

            throw new PaymentException('Nominal pembayaran dari Midtrans tidak valid.', 422);
        }

        if ($incomingCents <= 0 || $incomingCents !== $expectedCents) {
            Log::critical('Midtrans gross_amount mismatch detected', [
                'payment_id' => $payment->id,
                'order_id' => $payment->order_id,
                'expected_cents' => $expectedCents,
                'incoming_cents' => $incomingCents,
                'source' => $source,
            ]);

            throw new PaymentException('Nominal pembayaran tidak sesuai dengan tagihan terdaftar.', 422);
        }
    }

    /**
     * Whitelist non-sensitive transaction metadata from Midtrans notifications before persisting.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function sanitizeWebhookPayload(array $payload): array
    {
        $allowedKeys = [
            'order_id',
            'transaction_id',
            'transaction_status',
            'fraud_status',
            'status_code',
            'status_message',
            'payment_type',
            'gross_amount',
            'currency',
            'transaction_time',
            'settlement_time',
            'expiry_time',
            'refund_amount',
            'refund_key',
            'refund_chargeback_id',
        ];

        $sanitized = [];
        foreach ($allowedKeys as $key) {
            if (array_key_exists($key, $payload) && $payload[$key] !== null) {
                $sanitized[$key] = $payload[$key];
            }
        }

        return $sanitized;
    }

    protected function parseMidtransTime(mixed $value): ?CarbonInterface
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $context
     */
    protected function notifyPaymentStatusChange(
        Payment $payment,
        PaymentStatus $status,
        string $rawStatus,
        array $context = []
    ): void {
        $payment->loadMissing(['registration.competition', 'registration.team.members']);
        $registration = $payment->registration;
        if (! $registration) {
            return;
        }

        $recipientIds = collect();
        if ($registration->participant_id) {
            $recipientIds->push($registration->participant_id);
        }
        if ($registration->team) {
            if ($registration->team->leader_id) {
                $recipientIds->push($registration->team->leader_id);
            }
            foreach ($registration->team->members as $member) {
                $recipientIds->push($member->id);
            }
        }

        $recipientIds = $recipientIds->filter()->unique()->values();
        if ($recipientIds->isEmpty()) {
            return;
        }

        $compName = $registration->competition?->name ?? 'Kompetisi';
        $refundText = isset($context['refund_amount']) && is_numeric($context['refund_amount'])
            ? 'Rp ' . number_format((float) $context['refund_amount'], 0, ',', '.')
            : 'sebagian dana';
        $netText = isset($context['net_paid_amount']) && is_numeric($context['net_paid_amount'])
            ? 'Rp ' . number_format((float) $context['net_paid_amount'], 0, ',', '.')
            : 'tidak diketahui';

        [$title, $message] = match (true) {
            $rawStatus === 'refund' => [
                "Dana Pembayaran {$payment->order_id} Dikembalikan Penuh",
                "Pembayaran untuk pendaftaran {$registration->registration_number} ({$compName}) mengalami refund penuh ({$refundText}). Pendaftaran tidak dianggap lunas.",
            ],
            $rawStatus === 'partial_refund' && $status === PaymentStatus::PAID => [
                "Partial Refund Dicatat pada {$payment->order_id}",
                "Tercatat partial refund sebesar {$refundText} pada pendaftaran {$registration->registration_number} ({$compName}). Sisa nominal bersih {$netText} masih mencukupi biaya pendaftaran.",
            ],
            $rawStatus === 'partial_refund' => [
                "Partial Refund Memerlukan Pelunasan Ulang: {$payment->order_id}",
                "Tercatat partial refund sebesar {$refundText} pada pendaftaran {$registration->registration_number} ({$compName}) dengan sisa bersih {$netText}. Pendaftaran tidak lagi berstatus lunas.",
            ],
            $rawStatus === 'chargeback' || $rawStatus === 'partial_chargeback' => [
                "Chargeback pada Pembayaran {$payment->order_id}",
                "Transaksi pembayaran untuk pendaftaran {$registration->registration_number} ({$compName}) mengalami {$rawStatus} ({$refundText}). Pembayaran ditandai gagal dan pendaftaran tidak dianggap lunas.",
            ],
            $status === PaymentStatus::PAID => [
                "Pembayaran Lunas: {$payment->order_id}",
                "Pembayaran untuk pendaftaran {$registration->registration_number} ({$compName}) telah dikonfirmasi lunas dan menunggu verifikasi panitia.",
            ],
            $status === PaymentStatus::EXPIRED => [
                "Pembayaran Kedaluwarsa: {$payment->order_id}",
                "Batas waktu pembayaran untuk pendaftaran {$registration->registration_number} ({$compName}) telah habis. Silakan buat transaksi baru jika pendaftaran masih dibuka.",
            ],
            default => [
                "Pembaruan Status Pembayaran: {$payment->order_id}",
                "Status pembayaran pendaftaran {$registration->registration_number} ({$compName}) kini: {$status->label()}.",
            ],
        };

        foreach ($recipientIds as $userId) {
            Notification::create([
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => 'payment',
                'action_url' => "/portal/registrations/{$registration->id}",
            ]);
        }
    }

    /**
     * Determine whether user is allowed to initiate payment for a registration (PD-05).
     */
    public function canInitiatePayment(User $user, Registration $registration): bool
    {
        if ($registration->team_id !== null) {
            $registration->loadMissing('team');

            return $registration->team !== null && $registration->team->leader_id === $user->id;
        }

        return $registration->participant_id === $user->id;
    }

    /**
     * Get paginated payments visible to a participant (individual or team member per PD-05).
     */
    public function getParticipantPayments(User $user, ?int $registrationId = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = Payment::query()
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereHas('registration', function ($rq) use ($user) {
                        $rq->where('participant_id', $user->id)
                            ->orWhereHas('team', fn ($tq) => $tq->where('leader_id', $user->id))
                            ->orWhereHas('team.members', fn ($mq) => $mq->where('users.id', $user->id));
                    });
            })
            ->with(['registration.competition', 'registration.team.leader', 'user'])
            ->latest('id');

        if ($registrationId !== null) {
            $query->where('registration_id', $registrationId);
        }

        return $query->paginate(min(max($perPage, 1), 50));
    }

    /**
     * PD-06: Expiry is 24 hours (configured minutes) or registration_deadline, whichever is earlier.
     */
    protected function calculateExpiryTime(?CarbonInterface $registrationDeadline): CarbonInterface
    {
        $expiryMinutes = max(1, (int) config('midtrans.expiry_minutes', 1440));
        $defaultExpiry = now()->addMinutes($expiryMinutes);

        if ($registrationDeadline !== null && $registrationDeadline->lt($defaultExpiry)) {
            return $registrationDeadline->copy();
        }

        return $defaultExpiry;
    }

    /**
     * Generate a guaranteed unique Midtrans order_id.
     */
    protected function generateUniqueOrderId(int $registrationId): string
    {
        do {
            $candidate = sprintf(
                'ITC-PAY-%d-%s-%s',
                $registrationId,
                now()->format('YmdHis'),
                Str::upper(Str::random(5))
            );
        } while (Payment::where('order_id', $candidate)->exists());

        return $candidate;
    }
}
