<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CompetitionStatus;
use App\Models\Competition;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class CompetitionService
{
    /**
     * Get paginated published competitions for public view.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getPublicCompetitions(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Competition::query()->published();

        if (! empty($filters['category'])) {
            $query->category($filters['category']);
        }

        if (! empty($filters['target_level'])) {
            $query->targetLevel($filters['target_level']);
        }

        if (! empty($filters['status'])) {
            $query->status($filters['status']);
        }

        if (! empty($filters['search'])) {
            $query->search((string) $filters['search']);
        }

        $sortBy = $this->whitelistSort($filters['sort_by'] ?? 'created_at', [
            'created_at',
            'name',
            'registration_fee',
            'registration_start',
            'registration_end',
            'submission_deadline',
        ]);
        $sortOrder = strtolower((string) ($filters['sort_order'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
    }

    /**
     * Get active competitions collection (legacy support).
     *
     * @return Collection<int, Competition>
     */
    public function getActiveCompetitions(?string $category = null): Collection
    {
        $query = Competition::query()->published();

        if ($category) {
            $query->category($category);
        }

        return $query->latest()->get();
    }

    /**
     * Get public competition detail by slug.
     */
    public function getBySlug(string $slug): Competition
    {
        return Competition::query()
            ->published()
            ->where('slug', $slug)
            ->with([
                'judgingCriteria',
                'announcements' => fn ($q) => $q->where('is_published', true),
            ])
            ->firstOrFail();
    }

    /**
     * Get paginated competitions for admin.
     *
     * @param  array<string, mixed>  $filters
     */
    public function getAdminPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Competition::query();

        if (! empty($filters['search'])) {
            $query->search((string) $filters['search']);
        }

        if (! empty($filters['category'])) {
            $query->category($filters['category']);
        }

        if (! empty($filters['target_level'])) {
            $query->targetLevel($filters['target_level']);
        }

        if (! empty($filters['status'])) {
            $query->status($filters['status']);
        }

        if (isset($filters['is_published']) && $filters['is_published'] !== '' && $filters['is_published'] !== null) {
            $query->where('is_published', filter_var($filters['is_published'], FILTER_VALIDATE_BOOLEAN));
        }

        $sortBy = $this->whitelistSort($filters['sort_by'] ?? 'created_at', [
            'created_at',
            'name',
            'category',
            'target_level',
            'registration_fee',
            'registration_start',
            'registration_end',
            'submission_deadline',
            'status',
            'is_published',
        ]);
        $sortOrder = strtolower((string) ($filters['sort_order'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
    }

    /**
     * Create competition.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Competition
    {
        if (empty($data['slug']) && ! empty($data['name'])) {
            $data['slug'] = Competition::generateUniqueSlug($data['name']);
        }

        if (empty($data['status'])) {
            $data['status'] = CompetitionStatus::Draft;
        }

        if (! isset($data['is_published'])) {
            $data['is_published'] = false;
        }

        return Competition::create($data);
    }

    /**
     * Update competition.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Competition $competition, array $data): Competition
    {
        if (empty($data['slug']) && isset($data['name']) && $data['name'] !== $competition->name) {
            $data['slug'] = Competition::generateUniqueSlug($data['name'], $competition->id);
        }

        $competition->update($data);

        return $competition->fresh();
    }

    /**
     * Publish competition.
     */
    public function publish(Competition $competition): Competition
    {
        $competition->update(['is_published' => true]);

        return $competition;
    }

    /**
     * Unpublish competition.
     */
    public function unpublish(Competition $competition): Competition
    {
        $competition->update(['is_published' => false]);

        return $competition;
    }

    /**
     * Change competition status with transition validation.
     */
    public function changeStatus(Competition $competition, CompetitionStatus|string $newStatus): Competition
    {
        $target = $newStatus instanceof CompetitionStatus ? $newStatus : CompetitionStatus::from($newStatus);

        if (! $competition->status->canTransitionTo($target)) {
            throw ValidationException::withMessages([
                'status' => [
                    sprintf(
                        'Transisi status dari "%s" ke "%s" tidak diperbolehkan oleh aturan kompetisi.',
                        $competition->status->label(),
                        $target->label()
                    ),
                ],
            ]);
        }

        $competition->update(['status' => $target]);

        return $competition;
    }

    /**
     * Archive competition.
     */
    public function archive(Competition $competition): Competition
    {
        $competition->update([
            'status' => CompetitionStatus::Archived,
            'is_published' => false,
        ]);

        return $competition;
    }

    /**
     * Delete competition (only if no dependent data).
     */
    public function delete(Competition $competition): bool
    {
        if ($competition->teams()->exists() || $competition->registrations()->exists() || $competition->submissions()->exists()) {
            throw ValidationException::withMessages([
                'competition' => ['Kompetisi tidak dapat dihapus karena sudah memiliki data tim, registrasi, atau submission terkait. Silakan gunakan opsi arsip.'],
            ]);
        }

        return (bool) $competition->delete();
    }

    /**
     * Whitelist sort field to prevent column injection.
     *
     * @param  array<string>  $allowed
     */
    protected function whitelistSort(string $field, array $allowed): string
    {
        return in_array($field, $allowed, true) ? $field : 'created_at';
    }
}
