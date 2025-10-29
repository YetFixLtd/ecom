<?php

namespace Database\Factories\Attribute;

use App\Models\Attribute\Attribute;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attribute\Attribute>
 */
class AttributeFactory extends Factory
{
    protected $model = Attribute::class;

    public function definition(): array
    {
        $name = fake()->randomElement(['Color', 'Size', 'Material', 'Style', 'Weight', 'Capacity']);

        return [
            'name' => $name,
            'slug' => Str::slug($name) . '-' . fake()->unique()->numberBetween(1000, 9999),
            'position' => fake()->numberBetween(0, 100),
        ];
    }
}
