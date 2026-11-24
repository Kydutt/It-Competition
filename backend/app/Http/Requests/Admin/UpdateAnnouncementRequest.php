<?php

namespace App\Http\Requests\Admin;

use App\Enums\AnnouncementAudience;
use App\Enums\AnnouncementStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $announcementId = $this->route('announcement')?->id ?? $this->route('id');

        return [
            'event_id' => ['nullable', 'exists:events,id'],
            'competition_id' => ['nullable', 'exists:competitions,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('announcements', 'slug')->ignore($announcementId)],
            'content' => ['sometimes', 'required', 'string'],
            'thumbnail_path' => ['nullable', 'string', 'max:255'],
            'audience' => ['nullable', new Enum(AnnouncementAudience::class)],
            'status' => ['nullable', new Enum(AnnouncementStatus::class)],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
