<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShippingMethodResource extends JsonResource
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
            'code' => $this->code,
            'carrier' => $this->carrier,
            'description' => $this->description,
            'calculation_type' => $this->calculation_type,
            'base_rate' => (float) $this->base_rate,
            'per_kg_rate' => $this->per_kg_rate ? (float) $this->per_kg_rate : null,
            'per_item_rate' => $this->per_item_rate ? (float) $this->per_item_rate : null,
            'free_shipping_threshold' => $this->free_shipping_threshold ? (float) $this->free_shipping_threshold : null,
            'max_weight_kg' => $this->max_weight_kg ? (float) $this->max_weight_kg : null,
            'estimated_days' => $this->estimated_days,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'config' => $this->config,
            'orders_count' => $this->when(isset($this->orders_count), $this->orders_count),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
