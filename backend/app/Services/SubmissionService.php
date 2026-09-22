<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RegistrationStatus;
use App\Enums\SubmissionStatus;
use App\Models\Registration;
use App\Models\Submission;
use App\Models\Team;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class SubmissionService
{
    /**
     * Submit team project/work.
     *
     * @param  array<string, mixed>  $data
     */
    public function submitWork(User $user, array $data): Submission
    {
        $team = Team::findOrFail($data['team_id']);

        if ($team->leader_id !== $user->id) {
            throw ValidationException::withMessages([
                'team_id' => ['Only the team leader can submit works.'],
            ]);
        }

        $registration = Registration::where('team_id', $team->id)
            ->where('competition_id', $data['competition_id'])
            ->first();

        if (! $registration || $registration->status !== RegistrationStatus::Approved) {
            throw ValidationException::withMessages([
                'team_id' => ['Your team registration must be APPROVED before submitting.'],
            ]);
        }

        $submission = Submission::firstOrNew([
            'competition_id' => $data['competition_id'],
            'team_id' => $team->id,
        ]);

        $submission->title = $data['title'];
        $submission->description = $data['description'] ?? null;
        $submission->file_url = $data['file_url'] ?? null;
        $submission->demo_url = $data['demo_url'] ?? null;
        $submission->repository_url = $data['repository_url'] ?? null;
        $submission->status = SubmissionStatus::Submitted;
        $submission->submitted_at = now();
        $submission->save();

        return $submission->load(['competition', 'team']);
    }

    /**
     * Get user team submissions.
     *
     * @return Collection<int, Submission>
     */
    public function getUserSubmissions(User $user): Collection
    {
        return Submission::whereHas('team', fn ($q) => $q->where('leader_id', $user->id))
            ->with(['competition', 'team'])
            ->latest()
            ->get();
    }

    /**
     * Get paginated submissions for Admin or Judge.
     */
    public function getSubmissionsPaginated(?int $competitionId = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = Submission::with(['competition', 'team.leader', 'scores'])
            ->withCount('scores');

        if ($competitionId) {
            $query->where('competition_id', $competitionId);
        }

        return $query->latest()->paginate($perPage);
    }
}
