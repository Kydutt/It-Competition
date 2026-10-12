<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Competition;
use App\Models\JudgingCriteria;
use App\Models\JudgingSession;
use App\Models\Score;

class ScoringService
{
    /**
     * Calculate weighted score for a single criterion score.
     * Formula: (score / max_score) × weight
     */
    public function calculateWeightedScore(float $score, int $maxScore, float $weight): float
    {
        if ($maxScore <= 0) {
            return 0.0;
        }

        return round(($score / $maxScore) * $weight, 2);
    }

    /**
     * Calculate final score for a single judging session.
     * Returns sum of weighted scores across all criteria.
     */
    public function calculateSessionFinalScore(JudgingSession $session): float
    {
        $scores = $session->scores()->with('judgingCriteria')->get();
        $total = 0.0;

        foreach ($scores as $score) {
            $criterion = $score->judgingCriteria;
            if ($criterion && $criterion->is_active) {
                $total += $this->calculateWeightedScore(
                    $score->score,
                    $criterion->max_score,
                    $criterion->weight
                );
            }
        }

        return round($total, 2);
    }

    /**
     * Calculate the aggregated final score for a registration across multiple judges.
     *
     * For each active criterion:
     *   1. Average scores from all submitted judging sessions
     *   2. Calculate weighted: (avg_score / max_score) × weight
     * Final score = sum of all weighted averages.
     */
    public function calculateRegistrationFinalScore(int $registrationId, Competition $competition): float
    {
        $criteria = $competition->judgingCriteria()
            ->where('is_active', true)
            ->get();

        if ($criteria->isEmpty()) {
            return 0.0;
        }

        // Get all submitted/locked sessions for this registration
        $sessions = JudgingSession::whereHas('assignment', function ($q) use ($registrationId) {
            $q->where('registration_id', $registrationId);
        })
            ->whereIn('status', ['submitted', 'locked'])
            ->pluck('id');

        if ($sessions->isEmpty()) {
            return 0.0;
        }

        $totalWeightedScore = 0.0;

        foreach ($criteria as $criterion) {
            $scores = Score::whereIn('judging_session_id', $sessions)
                ->where('judging_criteria_id', $criterion->id)
                ->pluck('score');

            if ($scores->isEmpty()) {
                continue;
            }

            $avgScore = $scores->avg();

            $totalWeightedScore += $this->calculateWeightedScore(
                $avgScore,
                $criterion->max_score,
                $criterion->weight
            );
        }

        return round($totalWeightedScore, 2);
    }

    /**
     * Get detailed score breakdown for a registration (for admin view).
     */
    public function getRegistrationScoreBreakdown(int $registrationId, Competition $competition): array
    {
        $criteria = $competition->judgingCriteria()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $sessions = JudgingSession::with('assignment.judge.user')
            ->whereHas('assignment', function ($q) use ($registrationId) {
                $q->where('registration_id', $registrationId);
            })
            ->whereIn('status', ['submitted', 'locked'])
            ->get();

        $breakdown = [];

        foreach ($criteria as $criterion) {
            $criterionScores = [];

            foreach ($sessions as $session) {
                $score = Score::where('judging_session_id', $session->id)
                    ->where('judging_criteria_id', $criterion->id)
                    ->first();

                if ($score) {
                    $criterionScores[] = [
                        'judge_name' => $session->assignment->judge->user->name ?? 'Unknown',
                        'score' => $score->score,
                        'comment' => $score->comment,
                    ];
                }
            }

            $avgScore = collect($criterionScores)->avg('score') ?? 0;

            $breakdown[] = [
                'criterion_id' => $criterion->id,
                'criterion_name' => $criterion->name,
                'weight' => $criterion->weight,
                'max_score' => $criterion->max_score,
                'avg_score' => round($avgScore, 2),
                'weighted_score' => $this->calculateWeightedScore($avgScore, $criterion->max_score, $criterion->weight),
                'judge_scores' => $criterionScores,
            ];
        }

        return $breakdown;
    }
}
