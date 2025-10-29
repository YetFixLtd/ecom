<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
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
            'product_id' => $this->product_id,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'price' => $this->price,
            'compare_at_price' => $this->compare_at_price,
            'cost_price' => $this->cost_price,
            'currency' => $this->currency,
            'track_stock' => $this->track_stock,
            'allow_backorder' => $this->allow_backorder,
            'weight_grams' => $this->weight_grams,
            'length_mm' => $this->length_mm,
            'width_mm' => $this->width_mm,
            'height_mm' => $this->height_mm,
            'status' => $this->status,
            'attribute_values' => VariantAttributeValueResource::collection($this->whenLoaded('attributeValues')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
