<?php

namespace Database\Factories\Catalog;

use App\Models\Catalog\Brand;
use App\Models\Catalog\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Catalog\Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->words(3, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'short_description' => fake()->optional()->sentence(),
            'description' => fake()->optional()->paragraph(),
            'brand_id' => Brand::factory(),
            'product_type' => fake()->randomElement(['simple', 'variant', 'bundle']),
            'published_status' => fake()->randomElement(['draft', 'published', 'archived']),
            'visibility' => fake()->randomElement(['catalog', 'search', 'hidden']),
            'tax_class' => fake()->optional()->word(),
            'hs_code' => fake()->optional()->bothify('####'),
            'weight_grams' => fake()->optional()->numberBetween(100, 5000),
            'length_mm' => fake()->optional()->numberBetween(100, 1000),
            'width_mm' => fake()->optional()->numberBetween(100, 1000),
            'height_mm' => fake()->optional()->numberBetween(100, 1000),
            'is_featured' => fake()->boolean(20),
            'is_active' => true,
            'seo_title' => fake()->optional()->sentence(),
            'seo_description' => fake()->optional()->sentence(),
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }
}
