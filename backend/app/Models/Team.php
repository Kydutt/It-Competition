<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RegistrationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_id',
        'leader_id',
        'name',
        'code',
        'institution',
    ];

    protected static function booted(): void
    {
        static::creating(function (Team $team) {
            if (empty($team->code)) {
                $team->code = static::generateUniqueCode();
            }
        });
    }

    public static function generateUniqueCode(): string
    {
        do {
            $code = 'HITC-'.strtoupper(Str::random(5));
        } while (static::where('code', $code)->exists());

        return $code;
    }

    public function isLocked(): bool
    {
        $reg = $this->registration;
        if (! $reg) {
            return false;
        }

        return in_array($reg->status, [
            RegistrationStatus::Submitted,
            RegistrationStatus::UnderReview,
            RegistrationStatus::Approved,
        ], true);
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_members')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    public function registration(): HasOne
    {
        return $this->hasOne(Registration::class)->latestOfMany();
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function winner(): HasOne
    {
        return $this->hasOne(Winner::class);
    }
}
