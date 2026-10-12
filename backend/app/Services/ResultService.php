<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CompetitionResultStatus;
use App\Enums\JudgeAssignmentStatus;
use App\Enums\JudgingSessionStatus;
use App\Enums\RegistrationStatus;
use App\Models\Competition;
use App\Models\CompetitionResult;
use App\Models\JudgeAssignment;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ResultService
{
    public function __construct(
        protected ScoringService $scoringService,
        protected JudgingAuditService $auditService
    ) {}

    /**
     * Generate results for a competition.
     * Idempotent: can be re-run safely (upserts by competition_id+registration_id).
     */
    public function generateResults(Competition $competition, User $admin): Collection
    {
        // 1. Validate all eligible registrations have been judged
        $eligibleRegistrations = $this->getEligibleRegistrations($competition);

        if ($eligibleRegistrations->isEmpty()) {
            throw ValidationException::withMessages([
                'results' => ['Tidak ada registrasi yang memenuhi syarat untuk penilaian.'],
            ]);
        }

        // 2. Check judging completeness
        $unjudged = $this->getUnjudgedRegistrations($competition, $eligibleRegistrations);
        if ($unjudged->isNotEmpty()) {
            $regNumbers = $unjudged->pluck('registration_number')->implode(', ');
            throw ValidationException::withMessages([
                'results' => ["Penilaian belum selesai untuk registrasi: {$regNumbers}. Semua registrasi yang memenuhi syarat harus dinilai."],
            ]);
        }

        return DB::transaction(function () use ($competition, $eligibleRegistrations, $admin) {
            $results = collect();

            // 3. Calculate final scores for each registration
            $scored = [];
            foreach ($eligibleRegistrations as $registration) {
                $finalScore = $this->scoringService->calculateRegistrationFinalScore(
                    $registration->id,
                    $competition
                );
                $scored[] = [
                    'registration' => $registration,
                    'final_score' => $finalScore,
                ];
            }

            // 4. Sort by final_score DESC for ranking
            usort($scored, fn ($a, $b) => $b['final_score'] <=> $a['final_score']);

            // 5. Assign ranks with tie handling (same score = same rank)
            $rank = 1;
            $previousScore = null;
            $sameRankCount = 0;

            foreach ($scored as $i => $entry) {
                if ($previousScore !== null && abs($entry['final_score'] - $previousScore) >= 0.01) {
                    $rank += $sameRankCount;
                    $sameRankCount = 1;
                } else {
                    if ($previousScore !== null) {
                        $sameRankCount++;
                    } else {
                        $sameRankCount = 1;
                    }
                }

                $result = CompetitionResult::updateOrCreate(
                    [
                        'competition_id' => $competition->id,
                        'registration_id' => $entry['registration']->id,
                    ],
                    [
                        'final_score' => $entry['final_score'],
                        'rank' => $rank,
                        'result_status' => CompetitionResultStatus::Pending,
                    ]
                );

                $results->push($result);
                $previousScore = $entry['final_score'];
            }

            $this->auditService->log($admin, 'results_generated', 'Competition', $competition->id, [
                'total_results' => $results->count(),
            ]);

            return $results->load(['registration.team.leader', 'registration.user']);
        });
    }

    /**
     * Update result status (admin assigns winner, runner_up, etc.).
     */
    public function updateResultStatus(CompetitionResult $result, string $status, ?string $notes, User $admin): CompetitionResult
    {
        $validStatuses = array_column(CompetitionResultStatus::cases(), 'value');
        if (! in_array($status, $validStatuses)) {
            throw ValidationException::withMessages([
                'result_status' => ['Status hasil tidak valid.'],
            ]);
        }

        $result->update([
            'result_status' => $status,
            'notes' => $notes,
        ]);

        $this->auditService->log($admin, 'result_status_updated', 'CompetitionResult', $result->id, [
            'status' => $status,
            'notes' => $notes,
        ]);

        return $result->fresh(['registration.team.leader', 'registration.user']);
    }

    /**
     * Publish results for a competition.
     */
    public function publishResults(Competition $competition, User $admin): Collection
    {
        $results = CompetitionResult::where('competition_id', $competition->id)->get();

        if ($results->isEmpty()) {
            throw ValidationException::withMessages([
                'results' => ['Belum ada hasil yang digenerate untuk kompetisi ini.'],
            ]);
        }

        DB::transaction(function () use ($results, $competition, $admin) {
            $now = now();
            CompetitionResult::where('competition_id', $competition->id)
                ->update(['published_at' => $now]);

            $this->auditService->log($admin, 'results_published', 'Competition', $competition->id, [
                'total' => $results->count(),
            ]);
        });

        return CompetitionResult::where('competition_id', $competition->id)
            ->with(['registration.team.leader', 'registration.user'])
            ->orderBy('rank')
            ->get();
    }

    /**
     * Unpublish results for a competition.
     */
    public function unpublishResults(Competition $competition, User $admin): void
    {
        CompetitionResult::where('competition_id', $competition->id)
            ->update(['published_at' => null]);

        $this->auditService->log($admin, 'results_unpublished', 'Competition', $competition->id);
    }

    /**
     * Get published results for a competition (public/participant).
     */
    public function getPublishedResults(Competition $competition): Collection
    {
        return CompetitionResult::where('competition_id', $competition->id)
            ->whereNotNull('published_at')
            ->with(['registration.team.leader', 'registration.user'])
            ->orderBy('rank')
            ->get();
    }

    /**
     * Get admin results (includes unpublished).
     */
    public function getAdminResults(Competition $competition): Collection
    {
        return CompetitionResult::where('competition_id', $competition->id)
            ->with(['registration.team.leader', 'registration.user'])
            ->orderBy('rank')
            ->get();
    }

    /**
     * Get participant result for their own registration.
     */
    public function getParticipantResult(Registration $registration, User $user): ?CompetitionResult
    {
        $isOwner = $registration->user_id === $user->id;
        $isTeamMember = $registration->team?->members()->where('user_id', $user->id)->exists() ?? false;

        if (! $isOwner && ! $isTeamMember) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Anda tidak memiliki akses untuk melihat hasil ini.');
        }

        $result = CompetitionResult::where('registration_id', $registration->id)
            ->whereNotNull('published_at')
            ->first();

        return $result;
    }

    // ─── Helpers ─────────────────────────────────────────────────

    /**
     * Get eligible registrations for a competition.
     */
    protected function getEligibleRegistrations(Competition $competition): Collection
    {
        return Registration::where('competition_id', $competition->id)
            ->where('status', RegistrationStatus::Approved)
            ->whereHas('submission', fn ($q) => $q->whereIn('status', ['submitted', 'locked']))
            ->get();
    }

    /**
     * Find registrations that don't have completed judging.
     */
    protected function getUnjudgedRegistrations(Competition $competition, Collection $registrations): Collection
    {
        return $registrations->filter(function ($registration) {
            $completedAssignments = JudgeAssignment::where('registration_id', $registration->id)
                ->where('status', JudgeAssignmentStatus::Completed)
                ->count();

            return $completedAssignments === 0;
        });
    }
}
