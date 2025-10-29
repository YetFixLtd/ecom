<?php

namespace Database\Factories\Inventory;

use App\Models\Attribute\ProductVariant;
use App\Models\Inventory\Transfer;
use App\Models\Inventory\TransferItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransferItemFactory extends Factory
{
    protected $model = TransferItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'transfer_id' => Transfer::factory(),
            'variant_id' => ProductVariant::factory(),
            'qty' => fake()->numberBetween(1, 100),
        ];
    }
}
