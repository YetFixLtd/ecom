<?php

namespace App\Http\Resources\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Order Resource
 *
 * Formats order data for client API responses.
 */
class OrderResource extends JsonResource
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
            'order_number' => $this->order_number,
            'status' => $this->status,
            'currency' => $this->currency,
            'subtotal' => (float) $this->subtotal,
            'discount_total' => (float) $this->discount_total,
            'shipping_total' => (float) $this->shipping_total,
            'tax_total' => (float) $this->tax_total,
            'grand_total' => (float) $this->grand_total,
            'billing_address' => $this->whenLoaded('billingAddress', function () {
                return new AddressResource($this->billingAddress);
            }),
            'shipping_address' => $this->whenLoaded('shippingAddress', function () {
                return new AddressResource($this->shippingAddress);
            }),
            'shipping_method' => $this->whenLoaded('shippingMethod', function () {
                return [
                    'id' => $this->shippingMethod->id,
                    'name' => $this->shippingMethod->name,
                    'code' => $this->shippingMethod->code,
                    'carrier' => $this->shippingMethod->carrier,
                    'estimated_days' => $this->shippingMethod->estimated_days,
                ];
            }),
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'variant_id' => $item->variant_id,
                        'product_name' => $item->product_name,
                        'variant_sku' => $item->variant_sku,
                        'quantity' => $item->qty,
                        'unit_price' => (float) $item->unit_price,
                        'discount_total' => (float) $item->discount_total,
                        'tax_total' => (float) $item->tax_total,
                        'total' => (float) $item->total,
                    ];
                });
            }),
            'placed_at' => $this->placed_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
