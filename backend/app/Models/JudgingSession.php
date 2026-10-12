<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\JudgingSessionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JudgingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'judge_assignment_id',
        'started_at',
        'submitted_at',
        'status',
        'reopened_at',
        'reopened_by',
        'reopen_reason',
    ];

    protected function casts(): array
    {
        return [
            'status' => JudgingSessionStatus::class,
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'reopened_at' => 'datetime',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(JudgeAssignment::class, 'judge_assignment_id');
    }

    public function scores(): HasMany
    {
        return $this->hasMany(Score::class);
    }

    public function reopenedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reopened_by');
    }

    public function isEditable(): bool
    {
        return $this->status->isEditable();
    }

    public function isSubmitted(): bool
    {
        return $this->status === JudgingSessionStatus::Submitted;
    }

    public function isLocked(): bool
    {
        return $this->status === JudgingSessionStatus::Locked;
    }
}
