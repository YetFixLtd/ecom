<?php

namespace Database\Factories\Catalog;

use App\Models\Catalog\Brand;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Catalog\Brand>
 */
class BrandFactory extends Factory
{
    protected $model = Brand::class;

    public function definition(): array
    {
        $name = fake()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'website_url' => fake()->optional()->url(),
            'logo_url' => fake()->optional()->imageUrl(),
        ];
    }
}
