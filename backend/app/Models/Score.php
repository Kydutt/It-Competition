<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Score extends Model
{
    use HasFactory;

    protected $fillable = [
        'judging_session_id',
        'submission_id',
        'judge_id',
        'judging_criteria_id',
        'score',
        'feedback',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'float',
        ];
    }

    public function judgingSession(): BelongsTo
    {
        return $this->belongsTo(JudgingSession::class);
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function judge(): BelongsTo
    {
        return $this->belongsTo(User::class, 'judge_id');
    }

    public function judgingCriteria(): BelongsTo
    {
        return $this->belongsTo(JudgingCriteria::class);
    }
}
