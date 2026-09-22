<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\CompetitionTargetLevel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompetitionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $category = $this->category instanceof CompetitionCategory ? $this->category : CompetitionCategory::tryFrom((string) $this->category);
        $targetLevel = $this->target_level instanceof CompetitionTargetLevel ? $this->target_level : CompetitionTargetLevel::tryFrom((string) $this->target_level);
        $status = $this->status instanceof CompetitionStatus ? $this->status : CompetitionStatus::tryFrom((string) $this->status);

        $isAdmin = $request->user()?->isAdmin() ?? false;

        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'category' => $category?->value ?? (string) $this->category,
            'category_label' => $category?->label() ?? (string) $this->category,
            'description' => $this->description,
            'theme' => $this->theme,
            'target_level' => $targetLevel?->value ?? (string) $this->target_level,
            'target_level_label' => $targetLevel?->label() ?? (string) $this->target_level,
            'registration_fee' => (int) $this->registration_fee,
            'quota' => (int) $this->quota,
            'min_team_member' => (int) $this->min_team_member,
            'max_team_member' => (int) $this->max_team_member,
            'min_team_members' => (int) $this->min_team_member, // compatibility alias
            'max_team_members' => (int) $this->max_team_member, // compatibility alias
            'registration_start' => $this->registration_start?->toISOString(),
            'registration_end' => $this->registration_end?->toISOString(),
            'submission_start' => $this->submission_start?->toISOString(),
            'submission_deadline' => $this->submission_deadline?->toISOString(),
            'submission_end' => $this->submission_deadline?->toISOString(), // compatibility alias
            'status' => $status?->value ?? (string) $this->status,
            'status_label' => $status?->label() ?? (string) $this->status,
            'is_published' => (bool) $this->is_published,
            'is_active' => (bool) $this->is_active,
            'guidebook_url' => $this->guidebook_url,
            'poster_url' => $this->poster_url,
            'criteria' => $this->whenLoaded('judgingCriteria', fn () => $this->judgingCriteria->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'description' => $c->description,
                'weight' => (float) $c->weight,
                'max_score' => (int) $c->max_score,
            ])),
            'announcements' => $this->whenLoaded('announcements', fn () => $this->announcements->map(fn ($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'slug' => $a->slug,
                'published_at' => $a->published_at?->toISOString(),
            ])),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];

        return $data;
    }
}
