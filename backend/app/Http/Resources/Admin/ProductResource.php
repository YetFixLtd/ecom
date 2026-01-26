<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'slug' => $this->slug,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'brand_id' => $this->brand_id,
            'product_type' => $this->product_type,
            'published_status' => $this->published_status,
            'visibility' => $this->visibility,
            'tax_class' => $this->tax_class,
            'hs_code' => $this->hs_code,
            'weight_grams' => $this->weight_grams,
            'length_mm' => $this->length_mm,
            'width_mm' => $this->width_mm,
            'height_mm' => $this->height_mm,
            'is_featured' => $this->is_featured,
            'is_upcoming' => $this->is_upcoming,
            'call_for_price' => $this->call_for_price,
            'is_active' => $this->is_active,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'sort_order' => $this->sort_order,
            'brand' => new BrandResource($this->whenLoaded('brand')),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'images' => ProductImageResource::collection($this->whenLoaded('images')),
            'primary_image_path' => $this->when(
                $this->relationLoaded('images'),
                function () {
                    $first = $this->images->sortBy('position')->first();
                    return $first?->path_medium ?? $first?->path_original;
                }
            ),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'variants_count' => $this->whenCounted('variants'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}
