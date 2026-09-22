<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FaqResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'competition_id' => $this->competition_id,
            'question' => $this->question,
            'answer' => $this->answer,
            'category' => $this->category,
            'order' => (int) $this->order,
            'is_published' => (bool) $this->is_published,
        ];
    }
}
