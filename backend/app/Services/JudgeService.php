<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\JudgeAssignmentStatus;
use App\Enums\JudgingSessionStatus;
use App\Enums\RegistrationStatus;
use App\Enums\UserRole;
use App\Models\Competition;
use App\Models\Judge;
use App\Models\JudgeAssignment;
use App\Models\JudgingSession;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class JudgeService
{
    public function __construct(
        protected JudgingAuditService $auditService,
        protected CriteriaService $criteriaService
    ) {}

    // ─── Judge Profile Management ────────────────────────────────

    /**
     * Get paginated list of judges.
     */
    public function getPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Judge::with(['user', 'assignments'])
            ->when($filters['search'] ?? null, function ($q, $term) {
                $q->where('judge_code', 'like', "%{$term}%")
                    ->orWhere('institution', 'like', "%{$term}%")
                    ->orWhereHas('user', function ($uq) use ($term) {
                        $uq->where('name', 'like', "%{$term}%")
                            ->orWhere('email', 'like', "%{$term}%");
                    });
            })
            ->when(isset($filters['is_active']), fn ($q) => $q->where('is_active', (bool) $filters['is_active']))
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * Create a new judge (user + profile).
     */
    public function createJudge(array $data, User $admin): Judge
    {
        return DB::transaction(function () use ($data, $admin) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password'] ?? 'password123'),
                'role' => UserRole::Judge,
                'phone' => $data['phone'] ?? null,
                'institution' => $data['institution'] ?? null,
                'email_verified_at' => now(),
            ]);

            $judge = Judge::create([
                'user_id' => $user->id,
                'judge_code' => $data['judge_code'] ?? $this->generateJudgeCode(),
                'bio' => $data['bio'] ?? null,
                'institution' => $data['institution'] ?? $user->institution,
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->auditService->log($admin, 'judge_created', 'Judge', $judge->id, [
                'user_id' => $user->id,
                'judge_code' => $judge->judge_code,
            ]);

            return $judge->load('user');
        });
    }

    /**
     * Update judge profile.
     */
    public function updateJudge(Judge $judge, array $data, User $admin): Judge
    {
        return DB::transaction(function () use ($judge, $data, $admin) {
            $judgeData = array_filter([
                'bio' => $data['bio'] ?? null,
                'institution' => $data['institution'] ?? null,
                'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : null,
            ], fn ($v) => $v !== null);

            if (! empty($judgeData)) {
                $judge->update($judgeData);
            }

            // Update user fields too
            $userData = array_filter([
                'name' => $data['name'] ?? null,
                'phone' => $data['phone'] ?? null,
            ], fn ($v) => $v !== null);

            if (! empty($userData)) {
                $judge->user->update($userData);
            }

            $this->auditService->log($admin, 'judge_updated', 'Judge', $judge->id, [
                'changes' => $data,
            ]);

            return $judge->fresh('user');
        });
    }

    /**
     * Deactivate/delete a judge.
     */
    public function deleteJudge(Judge $judge, User $admin): void
    {
        $this->auditService->log($admin, 'judge_deleted', 'Judge', $judge->id, [
            'judge_code' => $judge->judge_code,
        ]);

        $judge->update(['is_active' => false]);
    }

    // ─── Assignment Management ───────────────────────────────────

    /**
     * Get paginated assignments with filters.
     */
    public function getAssignmentsPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return JudgeAssignment::with([
            'judge.user',
            'competition',
            'registration.team.leader',
            'registration.user',
            'session',
        ])
            ->when($filters['competition_id'] ?? null, fn ($q, $v) => $q->where('competition_id', $v))
            ->when($filters['judge_id'] ?? null, fn ($q, $v) => $q->where('judge_id', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * Assign a judge to a registration.
     */
    public function assignJudge(array $data, User $admin): JudgeAssignment
    {
        $judge = Judge::findOrFail($data['judge_id']);
        $registration = Registration::with(['competition', 'team.leader', 'user', 'submission'])->findOrFail($data['registration_id']);

        // Validate judge is active
        if (! $judge->is_active) {
            throw ValidationException::withMessages([
                'judge_id' => ['Juri ini tidak aktif dan tidak dapat ditugaskan.'],
            ]);
        }

        // Validate registration is approved
        if ($registration->status !== RegistrationStatus::Approved) {
            throw ValidationException::withMessages([
                'registration_id' => ['Registrasi ini belum disetujui dan tidak memenuhi syarat untuk penilaian.'],
            ]);
        }

        // Validate payment cleared
        if (! $registration->isPaymentCleared()) {
            throw ValidationException::withMessages([
                'registration_id' => ['Pembayaran registrasi ini belum terverifikasi.'],
            ]);
        }

        // Validate submission exists and is submitted/locked
        $submission = $registration->submission;
        if (! $submission || ! in_array($submission->status->value, ['submitted', 'locked'])) {
            throw ValidationException::withMessages([
                'registration_id' => ['Registrasi ini belum memiliki karya yang disubmit.'],
            ]);
        }

        // Validate criteria configured and weight = 100
        if (! $this->criteriaService->validateWeightSum($registration->competition)) {
            throw ValidationException::withMessages([
                'criteria' => ['Kriteria penilaian untuk kompetisi ini belum lengkap (bobot total harus 100%).'],
            ]);
        }

        // Prevent duplicate assignment
        $existing = JudgeAssignment::where('judge_id', $judge->id)
            ->where('registration_id', $registration->id)
            ->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'assignment' => ['Juri ini sudah ditugaskan untuk registrasi ini.'],
            ]);
        }

        // Basic conflict-of-interest detection
        $conflict = $this->detectConflict($judge, $registration);

        $assignment = JudgeAssignment::create([
            'judge_id' => $judge->id,
            'competition_id' => $registration->competition_id,
            'registration_id' => $registration->id,
            'assigned_at' => now(),
            'assigned_by' => $admin->id,
            'status' => $conflict ? JudgeAssignmentStatus::Conflict : JudgeAssignmentStatus::Assigned,
            'conflict_reason' => $conflict,
        ]);

        // Create the judging session
        JudgingSession::create([
            'judge_assignment_id' => $assignment->id,
            'status' => JudgingSessionStatus::NotStarted,
        ]);

        $this->auditService->log($admin, 'assignment_created', 'JudgeAssignment', $assignment->id, [
            'judge_id' => $judge->id,
            'registration_id' => $registration->id,
            'conflict' => $conflict,
        ]);

        return $assignment->load(['judge.user', 'competition', 'registration.team.leader', 'session']);
    }

    /**
     * Remove an assignment (only if not yet submitted).
     */
    public function removeAssignment(JudgeAssignment $assignment, User $admin): void
    {
        $session = $assignment->session;

        if ($session && ($session->isSubmitted() || $session->isLocked())) {
            throw ValidationException::withMessages([
                'assignment' => ['Penugasan ini sudah memiliki skor yang terfinalisasi dan tidak dapat dihapus.'],
            ]);
        }

        $this->auditService->log($admin, 'assignment_removed', 'JudgeAssignment', $assignment->id, [
            'judge_id' => $assignment->judge_id,
            'registration_id' => $assignment->registration_id,
        ]);

        $assignment->delete();
    }

    /**
     * Mark or update conflict status for an assignment.
     */
    public function markConflict(JudgeAssignment $assignment, string $reason, User $admin): JudgeAssignment
    {
        $assignment->update([
            'status' => JudgeAssignmentStatus::Conflict,
            'conflict_reason' => $reason,
        ]);

        $this->auditService->log($admin, 'assignment_conflict', 'JudgeAssignment', $assignment->id, [
            'reason' => $reason,
        ]);

        return $assignment->fresh(['judge.user', 'competition', 'registration.team.leader', 'session']);
    }

    // ─── Conflict Detection ──────────────────────────────────────

    /**
     * Detect basic conflict of interest between judge and registration.
     */
    protected function detectConflict(Judge $judge, Registration $registration): ?string
    {
        $judgeUser = $judge->user;

        // Judge is the participant
        if ($registration->user_id === $judgeUser->id) {
            return 'Juri adalah peserta yang terdaftar pada registrasi ini.';
        }

        // Judge is the team leader
        if ($registration->team && $registration->team->leader_id === $judgeUser->id) {
            return 'Juri adalah ketua tim dari registrasi ini.';
        }

        // Judge is a team member
        if ($registration->team) {
            $isMember = $registration->team->members()
                ->where('user_id', $judgeUser->id)
                ->exists();
            if ($isMember) {
                return 'Juri adalah anggota tim dari registrasi ini.';
            }
        }

        // Institution match (if both have institution data)
        $judgeInst = strtolower(trim($judge->institution ?? $judgeUser->institution ?? ''));
        $regInst = strtolower(trim($registration->user?->institution ?? ''));

        if ($judgeInst && $regInst && $judgeInst === $regInst) {
            return "Juri berasal dari institusi yang sama ({$judgeInst}).";
        }

        return null;
    }

    /**
     * Generate a unique judge code.
     */
    protected function generateJudgeCode(): string
    {
        do {
            $code = 'JDG-' . strtoupper(Str::random(6));
        } while (Judge::where('judge_code', $code)->exists());

        return $code;
    }

    // ─── Dashboard Stats ─────────────────────────────────────────

    /**
     * Get judging dashboard statistics for admin.
     */
    public function getDashboardStats(): array
    {
        $totalJudges = Judge::count();
        $activeJudges = Judge::where('is_active', true)->count();
        $totalAssignments = JudgeAssignment::count();

        $pending = JudgeAssignment::where('status', JudgeAssignmentStatus::Assigned)->count();
        $inProgress = JudgeAssignment::where('status', JudgeAssignmentStatus::InProgress)->count();
        $completed = JudgeAssignment::where('status', JudgeAssignmentStatus::Completed)->count();
        $conflicts = JudgeAssignment::where('status', JudgeAssignmentStatus::Conflict)->count();

        return [
            'total_judges' => $totalJudges,
            'active_judges' => $activeJudges,
            'total_assignments' => $totalAssignments,
            'pending' => $pending,
            'in_progress' => $inProgress,
            'completed' => $completed,
            'conflicts' => $conflicts,
        ];
    }
}
