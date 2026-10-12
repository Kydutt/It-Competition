<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\JudgeAssignmentStatus;
use App\Enums\JudgingSessionStatus;
use App\Models\JudgeAssignment;
use App\Models\JudgingCriteria;
use App\Models\JudgingSession;
use App\Models\Score;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class JudgingService
{
    public function __construct(
        protected JudgingAuditService $auditService
    ) {}

    // ─── Judge Assignment Retrieval ──────────────────────────────

    /**
     * Get assignments for a specific judge user.
     */
    public function getJudgeAssignments(User $judge): Collection
    {
        $judgeProfile = $judge->judgeProfile;

        if (! $judgeProfile) {
            return new Collection();
        }

        return JudgeAssignment::with([
            'competition',
            'registration.team.leader',
            'registration.submission.files',
            'registration.user',
            'session.scores.judgingCriteria',
        ])
            ->where('judge_id', $judgeProfile->id)
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Get a single assignment detail for a judge.
     */
    public function getAssignmentDetail(JudgeAssignment $assignment, User $judge): array
    {
        $judgeProfile = $judge->judgeProfile;

        if (! $judgeProfile || $assignment->judge_id !== $judgeProfile->id) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Anda tidak ditugaskan untuk registrasi ini.');
        }

        if ($assignment->isConflict()) {
            throw ValidationException::withMessages([
                'conflict' => ['Anda memiliki konflik kepentingan dengan registrasi ini dan tidak dapat menilai.'],
            ]);
        }

        $assignment->load([
            'competition.judgingCriteria' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'registration.team.leader',
            'registration.team.members.user',
            'registration.submission.files',
            'registration.user',
            'session.scores.judgingCriteria',
        ]);

        return [
            'assignment' => $assignment,
            'criteria' => $assignment->competition->judgingCriteria,
            'session' => $assignment->session,
            'existing_scores' => $assignment->session?->scores->keyBy('judging_criteria_id') ?? collect(),
        ];
    }

    // ─── Score Saving (Draft) ────────────────────────────────────

    /**
     * Save draft scores for an assignment (PUT).
     */
    public function saveDraftScores(JudgeAssignment $assignment, User $judge, array $scoresData): JudgingSession
    {
        $this->guardJudgeOwnership($assignment, $judge);
        $this->guardNotConflict($assignment);

        $session = $this->getOrCreateSession($assignment);

        if ($session->isSubmitted() || $session->isLocked()) {
            throw ValidationException::withMessages([
                'session' => ['Sesi penilaian ini sudah difinalisasi dan tidak dapat diubah.'],
            ]);
        }

        return DB::transaction(function () use ($assignment, $judge, $session, $scoresData) {
            $criteria = JudgingCriteria::where('competition_id', $assignment->competition_id)
                ->where('is_active', true)
                ->get()
                ->keyBy('id');

            foreach ($scoresData as $item) {
                $criterionId = $item['criterion_id'];
                $criterion = $criteria->get($criterionId);

                if (! $criterion) {
                    throw ValidationException::withMessages([
                        'scores' => ["Kriteria dengan ID {$criterionId} tidak ditemukan atau tidak aktif."],
                    ]);
                }

                $scoreValue = (float) $item['score'];

                if ($scoreValue < 0 || $scoreValue > $criterion->max_score) {
                    throw ValidationException::withMessages([
                        'scores' => ["Skor untuk \"{$criterion->name}\" harus antara 0 dan {$criterion->max_score}."],
                    ]);
                }

                Score::updateOrCreate(
                    [
                        'judging_session_id' => $session->id,
                        'judging_criteria_id' => $criterionId,
                    ],
                    [
                        'submission_id' => $assignment->registration->submission->id,
                        'judge_id' => $judge->judgeProfile->id,
                        'score' => $scoreValue,
                        'comment' => $item['comment'] ?? null,
                        'feedback' => $item['comment'] ?? null,
                    ]
                );
            }

            // Update session status to in_progress
            if ($session->status === JudgingSessionStatus::NotStarted) {
                $session->update([
                    'status' => JudgingSessionStatus::InProgress,
                    'started_at' => now(),
                ]);
            }

            // Update assignment status
            if ($assignment->status === JudgeAssignmentStatus::Assigned) {
                $assignment->update(['status' => JudgeAssignmentStatus::InProgress]);
            }

            $this->auditService->log($judge, 'scores_saved_draft', 'JudgingSession', $session->id, [
                'assignment_id' => $assignment->id,
                'scores_count' => count($scoresData),
            ]);

            return $session->fresh(['scores.judgingCriteria']);
        });
    }

    // ─── Score Finalization ──────────────────────────────────────

    /**
     * Finalize/submit scores for an assignment (POST).
     */
    public function submitScores(JudgeAssignment $assignment, User $judge): JudgingSession
    {
        $this->guardJudgeOwnership($assignment, $judge);
        $this->guardNotConflict($assignment);

        $session = $assignment->session;

        if (! $session) {
            throw ValidationException::withMessages([
                'session' => ['Sesi penilaian belum dimulai. Silakan simpan skor terlebih dahulu.'],
            ]);
        }

        if ($session->isSubmitted() || $session->isLocked()) {
            throw ValidationException::withMessages([
                'session' => ['Sesi penilaian ini sudah difinalisasi sebelumnya.'],
            ]);
        }

        // Verify all required criteria are scored
        $requiredCriteria = JudgingCriteria::where('competition_id', $assignment->competition_id)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        $scoredCriteria = $session->scores()->pluck('judging_criteria_id')->toArray();

        $missing = array_diff($requiredCriteria, $scoredCriteria);
        if (! empty($missing)) {
            throw ValidationException::withMessages([
                'scores' => ['Semua kriteria penilaian harus diisi sebelum finalisasi.'],
            ]);
        }

        // Validate all scores are within range
        foreach ($session->scores()->with('judgingCriteria')->get() as $score) {
            if ($score->score < 0 || $score->score > $score->judgingCriteria->max_score) {
                throw ValidationException::withMessages([
                    'scores' => ["Skor untuk \"{$score->judgingCriteria->name}\" di luar rentang yang valid."],
                ]);
            }
        }

        return DB::transaction(function () use ($assignment, $judge, $session) {
            $session->update([
                'status' => JudgingSessionStatus::Submitted,
                'submitted_at' => now(),
            ]);

            $assignment->update([
                'status' => JudgeAssignmentStatus::Completed,
            ]);

            $this->auditService->log($judge, 'scores_submitted', 'JudgingSession', $session->id, [
                'assignment_id' => $assignment->id,
            ]);

            return $session->fresh(['scores.judgingCriteria']);
        });
    }

    // ─── Admin Reopen ────────────────────────────────────────────

    /**
     * Reopen a submitted/locked judging session.
     */
    public function reopenSession(JudgingSession $session, User $admin, string $reason): JudgingSession
    {
        if (! $session->isSubmitted() && ! $session->isLocked()) {
            throw ValidationException::withMessages([
                'session' => ['Hanya sesi yang sudah difinalisasi yang dapat dibuka kembali.'],
            ]);
        }

        return DB::transaction(function () use ($session, $admin, $reason) {
            $session->update([
                'status' => JudgingSessionStatus::InProgress,
                'submitted_at' => null,
                'reopened_at' => now(),
                'reopened_by' => $admin->id,
                'reopen_reason' => $reason,
            ]);

            $session->assignment->update([
                'status' => JudgeAssignmentStatus::InProgress,
            ]);

            $this->auditService->log($admin, 'session_reopened', 'JudgingSession', $session->id, [
                'reason' => $reason,
            ]);

            return $session->fresh(['scores.judgingCriteria', 'assignment']);
        });
    }

    // ─── Guard Helpers ───────────────────────────────────────────

    protected function guardJudgeOwnership(JudgeAssignment $assignment, User $judge): void
    {
        $judgeProfile = $judge->judgeProfile;

        if (! $judgeProfile || $assignment->judge_id !== $judgeProfile->id) {
            throw new \Illuminate\Auth\Access\AuthorizationException('Anda tidak ditugaskan untuk registrasi ini.');
        }
    }

    protected function guardNotConflict(JudgeAssignment $assignment): void
    {
        if ($assignment->isConflict()) {
            throw ValidationException::withMessages([
                'conflict' => ['Anda memiliki konflik kepentingan dan tidak dapat menilai registrasi ini.'],
            ]);
        }
    }

    protected function getOrCreateSession(JudgeAssignment $assignment): JudgingSession
    {
        return $assignment->session ?? JudgingSession::create([
            'judge_assignment_id' => $assignment->id,
            'status' => JudgingSessionStatus::NotStarted,
        ]);
    }
}
