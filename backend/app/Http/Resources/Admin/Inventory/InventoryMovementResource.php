<?php

namespace App\Http\Resources\Admin\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryMovementResource extends JsonResource
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
            'qty_change' => $this->qty_change,
            'movement_type' => $this->movement_type,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'unit_cost' => $this->unit_cost,
            'reason_code' => $this->reason_code,
            'note' => $this->note,
            'is_incoming' => $this->isIncoming(),
            'is_outgoing' => $this->isOutgoing(),
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
