<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\JudgingCriteria;
use App\Models\Score;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class JudgingService
{
    /**
     * Score a submission for multiple criteria.
     *
     * @param  array{submission_id: int, scores: array<int, array{judging_criteria_id: int, score: float, feedback?: ?string}>}  $data
     * @return Collection<int, Score>
     */
    public function scoreSubmission(User $judge, array $data): Collection
    {
        return DB::transaction(function () use ($judge, $data) {
            $submission = Submission::findOrFail($data['submission_id']);
            $savedScores = collect();

            foreach ($data['scores'] as $item) {
                $score = Score::updateOrCreate(
                    [
                        'submission_id' => $submission->id,
                        'judge_id' => $judge->id,
                        'judging_criteria_id' => $item['judging_criteria_id'],
                    ],
                    [
                        'score' => $item['score'],
                        'feedback' => $item['feedback'] ?? null,
                    ]
                );
                $savedScores->push($score);
            }

            return $savedScores->load('judgingCriteria');
        });
    }

    /**
     * Get submission with criteria and judge scores.
     */
    public function getSubmissionEvaluation(Submission $submission, User $judge): array
    {
        $criteria = JudgingCriteria::where('competition_id', $submission->competition_id)->get();
        $scores = Score::where('submission_id', $submission->id)
            ->where('judge_id', $judge->id)
            ->get()
            ->keyBy('judging_criteria_id');

        return [
            'submission' => $submission->load(['competition', 'team']),
            'criteria' => $criteria,
            'existing_scores' => $scores,
        ];
    }
}
