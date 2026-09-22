<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\CompetitionTargetLevel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Competition extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'category',
        'description',
        'theme',
        'target_level',
        'registration_fee',
        'quota',
        'min_team_member',
        'max_team_member',
        'registration_start',
        'registration_end',
        'submission_start',
        'submission_deadline',
        'status',
        'is_published',
        'guidebook_url',
        'poster_url',
    ];

    protected function casts(): array
    {
        return [
            'category' => CompetitionCategory::class,
            'target_level' => CompetitionTargetLevel::class,
            'status' => CompetitionStatus::class,
            'registration_fee' => 'integer',
            'quota' => 'integer',
            'min_team_member' => 'integer',
            'max_team_member' => 'integer',
            'registration_start' => 'datetime',
            'registration_end' => 'datetime',
            'submission_start' => 'datetime',
            'submission_deadline' => 'datetime',
            'is_published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Competition $competition) {
            if (empty($competition->slug)) {
                $competition->slug = static::generateUniqueSlug($competition->name);
            }
            if ($competition->status === null) {
                $competition->status = CompetitionStatus::Draft;
            }
        });
    }

    public static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name);
        $original = $slug;
        $counter = 1;

        while (static::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$original}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    // Scopes
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeCategory(Builder $query, CompetitionCategory|string|null $category): Builder
    {
        if (! $category) {
            return $query;
        }

        $value = $category instanceof CompetitionCategory ? $category->value : $category;

        return $query->where('category', $value);
    }

    public function scopeTargetLevel(Builder $query, CompetitionTargetLevel|string|null $targetLevel): Builder
    {
        if (! $targetLevel) {
            return $query;
        }

        $value = $targetLevel instanceof CompetitionTargetLevel ? $targetLevel->value : $targetLevel;

        return $query->where('target_level', $value);
    }

    public function scopeStatus(Builder $query, CompetitionStatus|string|null $status): Builder
    {
        if (! $status) {
            return $query;
        }

        $value = $status instanceof CompetitionStatus ? $status->value : $status;

        return $query->where('status', $value);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! $term) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
                ->orWhere('slug', 'like', "%{$term}%")
                ->orWhere('theme', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%");
        });
    }

    // Backwards-compatible Accessors
    protected function minTeamMembers(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->min_team_member,
            set: fn ($value) => ['min_team_member' => $value]
        );
    }

    protected function maxTeamMembers(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->max_team_member,
            set: fn ($value) => ['max_team_member' => $value]
        );
    }

    protected function submissionEnd(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->submission_deadline,
            set: fn ($value) => ['submission_deadline' => $value]
        );
    }

    protected function isActive(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->is_published && $this->status !== CompetitionStatus::Archived,
            set: fn ($value) => ['is_published' => (bool) $value]
        );
    }

    // Relationships
    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function judgingCriteria(): HasMany
    {
        return $this->hasMany(JudgingCriteria::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    public function winners(): HasMany
    {
        return $this->hasMany(Winner::class);
    }

    public function faqs(): HasMany
    {
        return $this->hasMany(Faq::class);
    }
}
