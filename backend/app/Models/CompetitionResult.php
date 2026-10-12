<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CompetitionResultStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_id',
        'registration_id',
        'final_score',
        'rank',
        'result_status',
        'notes',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'result_status' => CompetitionResultStatus::class,
            'final_score' => 'float',
            'rank' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function isPublished(): bool
    {
        return $this->published_at !== null;
    }
}
