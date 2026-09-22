<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Models\Competition;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\Team;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RegistrationService
{
    /**
     * Register a team for competition.
     *
     * @param  array<string, mixed>  $data
     */
    public function register(User $user, array $data): Registration
    {
        return DB::transaction(function () use ($user, $data) {
            $competition = Competition::findOrFail($data['competition_id']);
            $team = Team::findOrFail($data['team_id']);

            if ($team->leader_id !== $user->id) {
                throw ValidationException::withMessages([
                    'team_id' => ['Only team leaders can register the team.'],
                ]);
            }

            if ($team->competition_id !== $competition->id) {
                throw ValidationException::withMessages([
                    'team_id' => ['This team is not created for this competition.'],
                ]);
            }

            $existing = Registration::where('team_id', $team->id)->first();
            if ($existing) {
                throw ValidationException::withMessages([
                    'team_id' => ['This team is already registered.'],
                ]);
            }

            $registrationNumber = 'REG-'.strtoupper(Str::random(10));

            $registration = Registration::create([
                'registration_number' => $registrationNumber,
                'competition_id' => $competition->id,
                'team_id' => $team->id,
                'user_id' => $user->id,
                'status' => RegistrationStatus::Submitted,
                'notes' => $data['notes'] ?? null,
            ]);

            // If competition has registration fee, create pending payment record
            Payment::create([
                'registration_id' => $registration->id,
                'user_id' => $user->id,
                'amount' => $competition->registration_fee,
                'status' => $competition->registration_fee > 0 ? PaymentStatus::Unpaid : PaymentStatus::NotRequired,
            ]);

            return $registration->load(['competition', 'team', 'payment']);
        });
    }

    /**
     * Get user registrations.
     *
     * @return Collection<int, Registration>
     */
    public function getUserRegistrations(User $user): Collection
    {
        return Registration::where('user_id', $user->id)
            ->with(['competition', 'team.members', 'payment'])
            ->latest()
            ->get();
    }

    /**
     * Get paginated registrations for admin.
     */
    public function getAdminPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return Registration::with(['competition', 'team.leader', 'payment'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Verify registration status (Admin).
     */
    public function verify(Registration $registration, RegistrationStatus $status, ?string $notes, User $admin): Registration
    {
        $registration->update([
            'status' => $status,
            'notes' => $notes ?? $registration->notes,
            'verified_at' => now(),
            'verified_by' => $admin->id,
        ]);

        return $registration->load(['competition', 'team', 'payment']);
    }
}
