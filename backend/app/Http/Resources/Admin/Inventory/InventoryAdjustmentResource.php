<?php

namespace App\Http\Resources\Admin\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryAdjustmentResource extends JsonResource
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
            'adjustment_mode' => $this->adjustment_mode,
            'qty_before' => $this->qty_before,
            'qty_change' => $this->qty_change,
            'qty_after' => $this->qty_after,
            'unit_cost' => $this->unit_cost,
            'reason_code' => $this->reason_code,
            'note' => $this->note,
            'variant' => $this->whenLoaded('variant'),
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'performed_by' => $this->whenLoaded('performedBy', function () {
                return [
                    'id' => $this->performedBy->id,
                    'name' => $this->performedBy->full_name,
                    'email' => $this->performedBy->email,
                ];
            }),
            'performed_at' => $this->performed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
