<?php

namespace App\Http\Resources\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Brand Resource
 *
 * Formats brand data for client API responses.
 */
class BrandResource extends JsonResource
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
            'website_url' => $this->website_url,
            'logo_url' => $this->logo_url,
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
