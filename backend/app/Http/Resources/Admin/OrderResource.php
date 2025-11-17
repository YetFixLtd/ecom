<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\Client\AddressResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin Order Resource
 *
 * Formats order data for admin API responses.
 * Includes all relationships and additional admin-specific fields.
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
            'shipping_option' => $this->shipping_option,
            'tax_total' => (float) $this->tax_total,
            'grand_total' => (float) $this->grand_total,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'email' => $this->user->email,
                    'first_name' => $this->user->first_name,
                    'last_name' => $this->user->last_name,
                    'full_name' => $this->user->full_name,
                    'phone' => $this->user->phone,
                ];
            }),
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
                    $fulfilledQty = 0;
                    if ($item->relationLoaded('fulfillmentItems')) {
                        $fulfilledQty = $item->fulfillmentItems->sum('qty');
                    }

                    return [
                        'id' => $item->id,
                        'variant_id' => $item->variant_id,
                        'product_name' => $item->product_name,
                        'variant_sku' => $item->variant_sku,
                        'qty' => $item->qty,
                        'fulfilled_qty' => $fulfilledQty,
                        'remaining_qty' => $item->qty - $fulfilledQty,
                        'unit_price' => (float) $item->unit_price,
                        'discount_total' => (float) $item->discount_total,
                        'tax_total' => (float) $item->tax_total,
                        'total' => (float) $item->total,
                        'variant' => $this->when($item->relationLoaded('variant'), function () use ($item) {
                            return $item->variant ? [
                                'id' => $item->variant->id,
                                'sku' => $item->variant->sku,
                            ] : null;
                        }),
                    ];
                });
            }),
            'payments' => $this->whenLoaded('payments', function () {
                return $this->payments->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'provider' => $payment->provider,
                        'provider_ref' => $payment->provider_ref,
                        'amount' => (float) $payment->amount,
                        'currency' => $payment->currency,
                        'status' => $payment->status,
                        'paid_at' => $payment->paid_at?->toIso8601String(),
                        'created_at' => $payment->created_at->toIso8601String(),
                    ];
                });
            }),
            'fulfillments' => $this->whenLoaded('fulfillments', function () {
                return FulfillmentResource::collection($this->fulfillments);
            }),
            'fulfillments_count' => $this->whenCounted('fulfillments'),
            'placed_at' => $this->placed_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
