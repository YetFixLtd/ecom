<?php

namespace App\Http\Resources\Admin\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryItemResource extends JsonResource
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
            'warehouse_id' => $this->warehouse_id,
            'on_hand' => $this->on_hand,
            'reserved' => $this->reserved,
            'available' => $this->available,
            'safety_stock' => $this->safety_stock,
            'reorder_point' => $this->reorder_point,
            'is_below_safety_stock' => $this->isBelowSafetyStock(),
            'needs_reorder' => $this->needsReorder(),
            'variant' => $this->whenLoaded('variant'),
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
