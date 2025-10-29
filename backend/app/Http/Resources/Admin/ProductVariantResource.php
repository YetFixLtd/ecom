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
            'inventory_summary' => $this->when(
                ($request->has('with_inventory') || $request->boolean('with_inventory')) && $this->relationLoaded('inventoryItems'),
                function () {
                    $items = $this->inventoryItems ?? collect();
                    return [
                        'total_on_hand' => $items->sum('on_hand'),
                        'total_reserved' => $items->sum('reserved'),
                        'total_available' => $items->sum(function ($item) {
                            return max(0, $item->on_hand - $item->reserved);
                        }),
                        'warehouses' => $items->map(function ($item) {
                            return [
                                'warehouse_id' => $item->warehouse_id,
                                'warehouse_name' => $item->warehouse->name ?? null,
                                'on_hand' => $item->on_hand,
                                'reserved' => $item->reserved,
                                'available' => max(0, $item->on_hand - $item->reserved),
                            ];
                        })->values(),
                    ];
                }
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
