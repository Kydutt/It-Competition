<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JudgeAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'judge_id' => $this->judge_id,
            'competition_id' => $this->competition_id,
            'registration_id' => $this->registration_id,
            'assigned_at' => $this->assigned_at?->toISOString(),
            'status' => $this->status?->value ?? $this->status,
            'status_label' => $this->status instanceof \App\Enums\JudgeAssignmentStatus ? $this->status->label() : $this->status,
            'conflict_reason' => $this->conflict_reason,
            'judge' => $this->whenLoaded('judge', fn () => new JudgeResource($this->judge)),
            'competition' => $this->whenLoaded('competition', fn () => [
                'id' => $this->competition->id,
                'name' => $this->competition->name,
                'slug' => $this->competition->slug,
                'category' => $this->competition->category?->value,
            ]),
            'registration' => $this->whenLoaded('registration', fn () => [
                'id' => $this->registration->id,
                'registration_number' => $this->registration->registration_number,
                'status' => $this->registration->status?->value,
                'user' => $this->registration->user ? [
                    'id' => $this->registration->user->id,
                    'name' => $this->registration->user->name,
                ] : null,
                'team' => $this->registration->team ? [
                    'id' => $this->registration->team->id,
                    'name' => $this->registration->team->name,
                    'leader' => $this->registration->team->leader ? [
                        'id' => $this->registration->team->leader->id,
                        'name' => $this->registration->team->leader->name,
                    ] : null,
                ] : null,
                'submission' => $this->registration->submission ? [
                    'id' => $this->registration->submission->id,
                    'title' => $this->registration->submission->title,
                    'status' => $this->registration->submission->status?->value,
                    'files' => $this->registration->submission->files?->map(fn ($f) => [
                        'id' => $f->id,
                        'file_name' => $f->file_name,
                        'file_type' => $f->file_type,
                        'file_size' => $f->file_size,
                    ]) ?? [],
                ] : null,
            ]),
            'session' => $this->whenLoaded('session', fn () => $this->session ? [
                'id' => $this->session->id,
                'status' => $this->session->status?->value ?? $this->session->status,
                'status_label' => $this->session->status instanceof \App\Enums\JudgingSessionStatus ? $this->session->status->label() : $this->session->status,
                'started_at' => $this->session->started_at?->toISOString(),
                'submitted_at' => $this->session->submitted_at?->toISOString(),
                'scores' => $this->session->scores?->map(fn ($s) => [
                    'id' => $s->id,
                    'criterion_id' => $s->judging_criteria_id,
                    'criterion_name' => $s->judgingCriteria?->name,
                    'score' => $s->score,
                    'comment' => $s->comment,
                    'max_score' => $s->judgingCriteria?->max_score,
                    'weight' => $s->judgingCriteria?->weight,
                ]) ?? [],
            ] : null),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
