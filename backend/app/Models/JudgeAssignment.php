<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\JudgeAssignmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class JudgeAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'judge_id',
        'competition_id',
        'registration_id',
        'assigned_at',
        'assigned_by',
        'status',
        'conflict_reason',
    ];

    protected function casts(): array
    {
        return [
            'status' => JudgeAssignmentStatus::class,
            'assigned_at' => 'datetime',
        ];
    }

    public function judge(): BelongsTo
    {
        return $this->belongsTo(Judge::class);
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function assignedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function session(): HasOne
    {
        return $this->hasOne(JudgingSession::class);
    }

    public function isConflict(): bool
    {
        return $this->status === JudgeAssignmentStatus::Conflict;
    }
}
