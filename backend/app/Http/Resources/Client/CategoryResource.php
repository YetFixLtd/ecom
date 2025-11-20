<?php

namespace App\Http\Resources\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Category Resource
 *
 * Formats category data for client API responses.
 */
class CategoryResource extends JsonResource
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
            'path' => $this->path,
            'parent_id' => $this->parent_id,
            'image_url' => $this->image_url,
            'image_path' => $this->image_path,
            'is_featured' => $this->is_featured,
            'status' => $this->status,
            'parent' => $this->whenLoaded('parent', function () {
                return new CategoryResource($this->parent);
            }),
            'children' => $this->whenLoaded('children', function () {
                return CategoryResource::collection($this->children);
            }),
            'products_count' => $this->when($this->relationLoaded('products'), function () {
                return $this->products->where('published_status', 'published')
                    ->where('is_active', true)
                    ->count();
            }, function () {
                return $this->products()
                    ->where('published_status', 'published')
                    ->where('is_active', true)
                    ->count();
            }),
        ];
    }
}
