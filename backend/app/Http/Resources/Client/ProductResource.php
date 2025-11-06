<?php

namespace App\Http\Resources\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Product Resource
 *
 * Formats product data for client API responses.
 * Only includes published and active products.
 */
class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $primaryImage = $this->primaryImage ?? $this->images->first();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'brand' => $this->whenLoaded('brand', function () {
                return [
                    'id' => $this->brand->id,
                    'name' => $this->brand->name,
                    'slug' => $this->brand->slug,
                ];
            }),
            'categories' => $this->whenLoaded('categories', function () {
                return $this->categories->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'slug' => $category->slug,
                    ];
                });
            }),
            'primary_image' => $primaryImage ? [
                'url' => $primaryImage->url,
                'alt_text' => $primaryImage->alt_text,
            ] : null,
            'images' => $this->whenLoaded('images', function () {
                return $this->images->map(function ($image) {
                    return [
                        'url' => $image->url,
                        'alt_text' => $image->alt_text,
                        'position' => $image->position,
                        'is_primary' => $image->is_primary,
                    ];
                });
            }),
            'variants' => $this->whenLoaded('variants', function () {
                return $this->variants->map(function ($variant) {
                    return [
                        'id' => $variant->id,
                        'sku' => $variant->sku,
                        'price' => (float) $variant->price,
                        'compare_at_price' => $variant->compare_at_price ? (float) $variant->compare_at_price : null,
                        'currency' => $variant->currency,
                        'status' => $variant->status,
                        'inventory' => $this->when($variant->relationLoaded('inventoryItems'), function () use ($variant) {
                            return $variant->inventoryItems->map(function ($item) {
                                return [
                                    'warehouse_id' => $item->warehouse_id,
                                    'available' => $item->available,
                                    'on_hand' => $item->on_hand,
                                    'reserved' => $item->reserved,
                                ];
                            });
                        }),
                    ];
                });
            }),
            'min_price' => $this->when($this->relationLoaded('variants'), function () {
                return $this->variants->min('price') ? (float) $this->variants->min('price') : null;
            }),
            'max_price' => $this->when($this->relationLoaded('variants'), function () {
                return $this->variants->max('price') ? (float) $this->variants->max('price') : null;
            }),
            'is_featured' => $this->is_featured,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
