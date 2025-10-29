<?php

namespace Database\Factories\Catalog;

use App\Models\Catalog\Product;
use App\Models\Catalog\ProductImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Catalog\ProductImage>
 */
class ProductImageFactory extends Factory
{
    protected $model = ProductImage::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'url' => fake()->imageUrl(),
            'alt_text' => fake()->optional()->sentence(),
            'position' => fake()->numberBetween(0, 10),
            'is_primary' => false,
        ];
    }
}
