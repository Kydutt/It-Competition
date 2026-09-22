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
        'submission_id',
        'judge_id',
        'judging_criteria_id',
        'score',
        'feedback',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'float',
        ];
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
