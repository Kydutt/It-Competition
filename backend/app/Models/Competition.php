<?php

namespace App\Models;

use App\Enums\CompetitionStatus;
use App\Enums\RegistrationType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Competition extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'event_id',
        'category_id',
        'name',
        'slug',
        'short_description',
        'description',
        'cover_image_path',
        'eligibility',
        'registration_type',
        'min_members',
        'max_members',
        'registration_fee',
        'registration_start',
        'registration_deadline',
        'submission_deadline',
        'status',
        'guidebook_path',
        'contact_information',
    ];

    protected function casts(): array
    {
        return [
            'registration_type' => RegistrationType::class,
            'status' => CompetitionStatus::class,
            'min_members' => 'integer',
            'max_members' => 'integer',
            'registration_fee' => 'decimal:2',
            'registration_start' => 'datetime',
            'registration_deadline' => 'datetime',
            'submission_deadline' => 'datetime',
            'contact_information' => 'array',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(CompetitionCategory::class, 'category_id');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }
}
