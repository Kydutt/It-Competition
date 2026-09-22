<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PaymentService
{
    /**
     * Initiate payment record for a paid competition registration.
     */
    public function createPayment(User $user, int $registrationId, string $method = 'bank_transfer'): Payment
    {
        /** @var Registration $registration */
        $registration = Registration::with('competition', 'team')->findOrFail($registrationId);

        // 1. Verify ownership
        $isOwner = $registration->user_id === $user->id;
        $isLeader = $registration->team && $registration->team->leader_id === $user->id;

        if (! $user->isAdmin() && ! $isOwner && ! $isLeader) {
            throw ValidationException::withMessages([
                'registration_id' => ['Anda tidak memiliki otorisasi untuk melakukan pembayaran pada pendaftaran ini.'],
            ]);
        }

        $competition = $registration->competition;

        // 2. Free competition bypass
        if ((int) $competition->registration_fee === 0) {
            throw ValidationException::withMessages([
                'registration_id' => ['Kompetisi ini gratis dan tidak memerlukan pembayaran.'],
            ]);
        }

        // 3. Existing payment checks
        $existing = Payment::where('registration_id', $registration->id)->first();
        if ($existing) {
            if ($existing->isApproved()) {
                throw ValidationException::withMessages([
                    'registration_id' => ['Pembayaran untuk pendaftaran ini telah disetujui sebelumnya.'],
                ]);
            }

            return $existing->load(['registration.competition', 'registration.team.leader', 'user', 'reviewer']);
        }

        // 4. Create new payment with server-determined amount
        return DB::transaction(function () use ($registration, $competition, $user, $method) {
            $payment = Payment::create([
                'registration_id' => $registration->id,
                'user_id' => $user->id,
                'amount' => (int) $competition->registration_fee,
                'payment_method' => $method,
                'status' => PaymentStatus::Pending,
            ]);

            return $payment->load(['registration.competition', 'registration.team.leader', 'user']);
        });
    }

    /**
     * Upload payment proof to private storage.
     */
    public function uploadProof(User $user, Payment $payment, UploadedFile $file): Payment
    {
        // 1. Check permission
        $isOwner = $payment->user_id === $user->id || $payment->registration?->user_id === $user->id;
        if (! $user->isAdmin() && ! $isOwner) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Anda tidak memiliki akses untuk mengunggah bukti pembayaran ini.');
        }

        if (! $payment->canUploadProof()) {
            throw ValidationException::withMessages([
                'payment' => [
                    sprintf('Bukti pembayaran tidak dapat diunggah karena status pembayaran saat ini "%s".', $payment->status->label()),
                ],
            ]);
        }

        // 2. Validate file size and MIME
        $allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
        $mime = $file->getMimeType();

        if (! in_array($mime, $allowedMimes, true)) {
            throw ValidationException::withMessages([
                'proof' => ['Format berkas tidak didukung. Harap unggah berkas JPG, PNG, atau PDF.'],
            ]);
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'proof' => ['Ukuran berkas melebihi batas maksimum 5 MB.'],
            ]);
        }

        // Disallow dangerous extensions
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $forbiddenExtensions = ['php', 'phtml', 'php5', 'html', 'htm', 'js', 'exe', 'sh', 'bat', 'cmd'];
        if (in_array($extension, $forbiddenExtensions, true)) {
            throw ValidationException::withMessages([
                'proof' => ['Jenis berkas tidak diizinkan untuk alasan keamanan.'],
            ]);
        }

        // 3. Store in private filesystem
        $folder = sprintf('payments/%d/%d', $payment->registration_id, $payment->id);
        $randomName = sprintf('proof_%s.%s', Str::random(24), $extension);

        // Delete old file if present
        if ($payment->proof_path && Storage::disk('local')->exists($payment->proof_path)) {
            Storage::disk('local')->delete($payment->proof_path);
        }

        $storedPath = Storage::disk('local')->putFileAs($folder, $file, $randomName);

        // 4. Update status to submitted
        $payment->update([
            'proof_path' => $storedPath,
            'status' => PaymentStatus::Submitted,
            'rejection_reason' => null,
        ]);

        return $payment->fresh(['registration.competition', 'registration.team.leader', 'user', 'reviewer']);
    }

    /**
     * Submit payment for admin review.
     */
    public function submitPayment(User $user, Payment $payment): Payment
    {
        $isOwner = $payment->user_id === $user->id || $payment->registration?->user_id === $user->id;
        if (! $user->isAdmin() && ! $isOwner) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Anda tidak memiliki akses untuk mengajukan verifikasi pembayaran ini.');
        }

        if (empty($payment->proof_path) || ! Storage::disk('local')->exists($payment->proof_path)) {
            throw ValidationException::withMessages([
                'payment' => ['Silakan unggah berkas bukti pembayaran terlebih dahulu sebelum mengajukan verifikasi.'],
            ]);
        }

        if ($payment->isApproved()) {
            throw ValidationException::withMessages([
                'payment' => ['Pembayaran ini telah disetujui sebelumnya.'],
            ]);
        }

        $payment->update([
            'status' => PaymentStatus::UnderReview,
            'submitted_at' => now(),
        ]);

        return $payment->fresh(['registration.competition', 'registration.team.leader', 'user', 'reviewer']);
    }

    /**
     * Get authorized payment proof file stream.
     */
    public function getPaymentProofFile(User $user, Payment $payment): StreamedResponse
    {
        $isOwner = $payment->user_id === $user->id || $payment->registration?->user_id === $user->id;
        $isTeamMember = $payment->registration?->team?->members()->where('user_id', $user->id)->exists() ?? false;

        if (! $user->isAdmin() && ! $isOwner && ! $isTeamMember) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengunduh bukti pembayaran ini.');
        }

        if (empty($payment->proof_path) || ! Storage::disk('local')->exists($payment->proof_path)) {
            abort(404, 'Berkas bukti pembayaran tidak ditemukan.');
        }

        return Storage::disk('local')->response($payment->proof_path);
    }

    /**
     * Admin approves payment.
     */
    public function approvePayment(Payment $payment, User $admin): Payment
    {
        if ($payment->isApproved()) {
            throw ValidationException::withMessages([
                'payment' => ['Pembayaran sudah dalam status disetujui.'],
            ]);
        }

        $payment->update([
            'status' => PaymentStatus::Approved,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
            'rejection_reason' => null,
        ]);

        return $payment->fresh(['registration.competition', 'registration.team.leader', 'user', 'reviewer']);
    }

    /**
     * Admin rejects payment with reason.
     */
    public function rejectPayment(Payment $payment, User $admin, string $reason): Payment
    {
        $trimmedReason = trim($reason);
        if (strlen($trimmedReason) < 5) {
            throw ValidationException::withMessages([
                'reason' => ['Alasan penolakan harus diisi minimal 5 karakter.'],
            ]);
        }

        $payment->update([
            'status' => PaymentStatus::Rejected,
            'rejection_reason' => $trimmedReason,
            'reviewed_at' => now(),
            'reviewed_by' => $admin->id,
        ]);

        return $payment->fresh(['registration.competition', 'registration.team.leader', 'user', 'reviewer']);
    }

    /**
     * Get user payments.
     *
     * @return Collection<int, Payment>
     */
    public function getUserPayments(User $user): Collection
    {
        return Payment::query()
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereHas('registration', fn ($q) => $q->where('user_id', $user->id))
                    ->orWhereHas('registration.team.members', fn ($q) => $q->where('user_id', $user->id));
            })
            ->with(['registration.competition', 'registration.team.leader', 'user', 'reviewer'])
            ->latest()
            ->get();
    }

    /**
     * Admin paginated list of payments with search and filtering.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getAdminPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Payment::query()->with([
            'registration.competition',
            'registration.team.leader',
            'user',
            'reviewer',
        ]);

        if (! empty($filters['competition_id'])) {
            $query->whereHas('registration', fn ($q) => $q->where('competition_id', $filters['competition_id']));
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['date'])) {
            $query->whereDate('created_at', $filters['date']);
        }

        if (! empty($filters['search'])) {
            $term = (string) $filters['search'];
            $query->where(function ($q) use ($term) {
                $q->whereHas('registration', fn ($rq) => $rq->where('registration_number', 'like', "%{$term}%"))
                    ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%"))
                    ->orWhereHas('registration.team', fn ($tq) => $tq->where('name', 'like', "%{$term}%"));
            });
        }

        return $query->latest('created_at')->paginate($perPage);
    }
}
