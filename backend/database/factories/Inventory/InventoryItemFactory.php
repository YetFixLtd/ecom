<?php

namespace Database\Factories\Inventory;

use App\Models\Attribute\ProductVariant;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryItemFactory extends Factory
{
    protected $model = InventoryItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'variant_id' => ProductVariant::factory(),
            'warehouse_id' => Warehouse::factory(),
            'on_hand' => fake()->numberBetween(0, 1000),
            'reserved' => fake()->numberBetween(0, 100),
            'safety_stock' => fake()->numberBetween(10, 50),
            'reorder_point' => fake()->numberBetween(20, 100),
        ];
    }
}
