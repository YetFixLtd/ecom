<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttributeValueResource extends JsonResource
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
            'attribute_id' => $this->attribute_id,
            'value' => $this->value,
            'value_key' => $this->value_key,
            'position' => $this->position,
            'attribute' => new AttributeResource($this->whenLoaded('attribute')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
