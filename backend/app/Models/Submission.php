<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SubmissionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_id',
        'competition_id',
        'team_id',
        'title',
        'description',
        'status',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => SubmissionStatus::class,
            'submitted_at' => 'datetime',
        ];
    }

    public function isDraft(): bool
    {
        return $this->status === SubmissionStatus::Draft;
    }

    public function isSubmitted(): bool
    {
        return $this->status === SubmissionStatus::Submitted;
    }

    public function isLocked(): bool
    {
        if ($this->status === SubmissionStatus::Locked) {
            return true;
        }

        // Automatic locking if competition deadline has passed
        if ($this->competition && $this->competition->submission_deadline && now()->gt($this->competition->submission_deadline)) {
            return true;
        }

        return false;
    }

    public function canBeModified(): bool
    {
        return ! $this->isLocked();
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(SubmissionFile::class);
    }
}
