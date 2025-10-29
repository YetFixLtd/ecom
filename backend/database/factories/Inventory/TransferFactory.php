<?php

namespace Database\Factories\Inventory;

use App\Models\Administrator;
use App\Models\Inventory\Transfer;
use App\Models\Inventory\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransferFactory extends Factory
{
    protected $model = Transfer::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'from_warehouse_id' => Warehouse::factory(),
            'to_warehouse_id' => Warehouse::factory(),
            'status' => 'draft',
            'created_by' => Administrator::factory(),
        ];
    }
}
