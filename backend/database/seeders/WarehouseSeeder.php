<?php

namespace Database\Seeders;

use App\Models\Inventory\Warehouse;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default warehouse if it doesn't exist
        Warehouse::firstOrCreate(
            ['code' => 'MAIN-001'],
            [
                'name' => 'Main Warehouse',
                'address1' => '123 Commerce Street',
                'city' => 'Dhaka',
                'country_code' => 'BD',
                'is_default' => true,
            ]
        );
    }
}
