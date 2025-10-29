<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttributeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'position' => $this->position,
            'values' => AttributeValueResource::collection($this->whenLoaded('values')),
            'values_count' => $this->whenCounted('values'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
