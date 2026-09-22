<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JudgingCriteria extends Model
{
    use HasFactory;

    protected $table = 'judging_criteria';

    protected $fillable = [
        'competition_id',
        'name',
        'description',
        'weight',
        'max_score',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'float',
            'max_score' => 'integer',
        ];
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function scores(): HasMany
    {
        return $this->hasMany(Score::class);
    }
}
