<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin Fulfillment Resource
 *
 * Formats fulfillment data for admin API responses.
 */
class FulfillmentResource extends JsonResource
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
            'order_id' => $this->order_id,
            'status' => $this->status,
            'tracking_number' => $this->tracking_number,
            'carrier' => $this->carrier,
            'shipped_at' => $this->shipped_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'order' => $this->whenLoaded('order', function () {
                return [
                    'id' => $this->order->id,
                    'order_number' => $this->order->order_number,
                    'status' => $this->order->status,
                    'grand_total' => (float) $this->order->grand_total,
                    'currency' => $this->order->currency,
                    'user' => $this->when($this->order->relationLoaded('user'), function () {
                        return $this->order->user ? [
                            'id' => $this->order->user->id,
                            'email' => $this->order->user->email,
                            'full_name' => $this->order->user->full_name,
                        ] : null;
                    }),
                    'shipping_address' => $this->when($this->order->relationLoaded('shippingAddress'), function () {
                        return $this->order->shippingAddress ? [
                            'name' => $this->order->shippingAddress->name,
                            'line1' => $this->order->shippingAddress->line1,
                            'line2' => $this->order->shippingAddress->line2,
                            'city' => $this->order->shippingAddress->city,
                            'state_region' => $this->order->shippingAddress->state_region,
                            'postal_code' => $this->order->shippingAddress->postal_code,
                            'country_code' => $this->order->shippingAddress->country_code,
                        ] : null;
                    }),
                ];
            }),
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'fulfillment_id' => $item->fulfillment_id,
                        'order_item_id' => $item->order_item_id,
                        'qty' => $item->qty,
                        'order_item' => $this->when($item->relationLoaded('orderItem'), function () use ($item) {
                            return $item->orderItem ? [
                                'id' => $item->orderItem->id,
                                'variant_id' => $item->orderItem->variant_id,
                                'product_name' => $item->orderItem->product_name,
                                'variant_sku' => $item->orderItem->variant_sku,
                                'qty' => $item->orderItem->qty,
                                'unit_price' => (float) $item->orderItem->unit_price,
                                'total' => (float) $item->orderItem->total,
                            ] : null;
                        }),
                    ];
                });
            }),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}

