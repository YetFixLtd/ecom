<?php

namespace Database\Factories\Attribute;

use App\Models\Attribute\ProductVariant;
use App\Models\Catalog\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attribute\ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'sku' => fake()->unique()->bothify('SKU-####-????'),
            'barcode' => fake()->optional()->ean13(),
            'price' => fake()->randomFloat(2, 10, 1000),
            'compare_at_price' => fake()->optional()->randomFloat(2, 10, 1500),
            'cost_price' => fake()->optional()->randomFloat(2, 5, 500),
            'currency' => 'BDT',
            'track_stock' => true,
            'allow_backorder' => false,
            'weight_grams' => fake()->optional()->numberBetween(100, 5000),
            'length_mm' => fake()->optional()->numberBetween(100, 1000),
            'width_mm' => fake()->optional()->numberBetween(100, 1000),
            'height_mm' => fake()->optional()->numberBetween(100, 1000),
            'status' => fake()->randomElement(['active', 'inactive']),
        ];
    }
}
