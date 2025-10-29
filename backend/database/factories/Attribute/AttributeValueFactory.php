<?php

namespace Database\Factories\Attribute;

use App\Models\Attribute\Attribute;
use App\Models\Attribute\AttributeValue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attribute\AttributeValue>
 */
class AttributeValueFactory extends Factory
{
    protected $model = AttributeValue::class;

    public function definition(): array
    {
        return [
            'attribute_id' => Attribute::factory(),
            'value' => fake()->word(),
            'value_key' => fake()->optional()->hexColor(),
            'position' => fake()->numberBetween(0, 100),
        ];
    }
}
