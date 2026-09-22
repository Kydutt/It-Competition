<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PaymentService
{
    /**
     * Submit payment proof.
     *
     * @param  array<string, mixed>  $data
     */
    public function submitProof(User $user, array $data): Payment
    {
        $registration = Registration::where('id', $data['registration_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        $payment = Payment::firstOrNew(['registration_id' => $registration->id]);

        $payment->user_id = $user->id;
        $payment->amount = (int) $data['amount'];
        $payment->payment_method = $data['payment_method'];
        $payment->proof_url = $data['proof_url'];
        $payment->notes = $data['notes'] ?? null;
        $payment->status = PaymentStatus::WaitingVerification;
        $payment->save();

        return $payment->load('registration.competition');
    }

    /**
     * Get user payments.
     *
     * @return Collection<int, Payment>
     */
    public function getUserPayments(User $user): Collection
    {
        return Payment::where('user_id', $user->id)
            ->with(['registration.competition', 'registration.team'])
            ->latest()
            ->get();
    }

    /**
     * Get paginated payments for admin.
     */
    public function getAdminPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return Payment::with(['registration.competition', 'registration.team', 'user'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Verify payment status (Admin).
     */
    public function verify(Payment $payment, PaymentStatus $status, ?string $notes, User $admin): Payment
    {
        $payment->update([
            'status' => $status,
            'notes' => $notes ?? $payment->notes,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        return $payment->load(['registration', 'user']);
    }
}
