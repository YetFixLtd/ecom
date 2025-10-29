<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VariantAttributeValueResource extends JsonResource
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
            'variant_id' => $this->variant_id,
            'attribute_id' => $this->attribute_id,
            'attribute_value_id' => $this->attribute_value_id,
            'attribute' => new AttributeResource($this->whenLoaded('attribute')),
            'attribute_value' => new AttributeValueResource($this->whenLoaded('attributeValue')),
        ];
    }
}
