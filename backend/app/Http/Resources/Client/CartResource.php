<?php

namespace App\Http\Resources\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Cart Resource
 *
 * Formats cart data for client API responses.
 */
class CartResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $items = $this->whenLoaded('items', $this->items, $this->items ?? collect());

        return [
            'id' => $this->id,
            'currency' => $this->currency,
            'status' => $this->status,
            'items' => $items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'variant_id' => $item->variant_id,
                    'quantity' => $item->qty,
                    'unit_price' => (float) $item->unit_price,
                    'line_total' => (float) $item->line_total,
                    'variant' => $this->when($item->relationLoaded('variant'), function () use ($item) {
                        $variant = $item->variant;
                        return [
                            'id' => $variant->id,
                            'sku' => $variant->sku,
                            'price' => (float) $variant->price,
                            'product' => $this->when($variant->relationLoaded('product'), function () use ($variant) {
                                $product = $variant->product;
                                return [
                                    'id' => $product->id,
                                    'name' => $product->name,
                                    'slug' => $product->slug,
                                    'primary_image' => $product->primaryImage ? [
                                        'url' => $product->primaryImage->url,
                                        'alt_text' => $product->primaryImage->alt_text,
                                    ] : null,
                                ];
                            }),
                        ];
                    }),
                ];
            }),
            'subtotal' => (float) $this->subtotal,
            'items_count' => $items->sum('qty'),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
