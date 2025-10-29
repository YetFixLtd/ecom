<?php

namespace Database\Factories\Inventory;

use App\Models\Inventory\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company() . ' Warehouse',
            'code' => fake()->unique()->regexify('[A-Z]{2,4}-[0-9]{3,6}'),
            'address1' => fake()->streetAddress(),
            'address2' => fake()->optional()->secondaryAddress(),
            'city' => fake()->city(),
            'state_region' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'country_code' => fake()->countryCode(),
            'is_default' => false,
        ];
    }
}
