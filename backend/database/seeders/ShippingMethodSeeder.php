<?php

namespace Database\Seeders;

use App\Models\Order\ShippingMethod;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ShippingMethodSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create shipping method for "Inside Dhaka"
        ShippingMethod::firstOrCreate(
            ['code' => 'inside_dhaka'],
            [
                'name' => 'ঢাকার ভেতরে',
                'code' => 'inside_dhaka',
                'carrier' => 'Local Delivery',
                'description' => 'Delivery inside Dhaka city',
                'calculation_type' => 'flat',
                'base_rate' => 60.00,
                'per_kg_rate' => null,
                'per_item_rate' => null,
                'free_shipping_threshold' => null,
                'max_weight_kg' => null,
                'estimated_days' => 1,
                'is_active' => true,
                'sort_order' => 1,
                'config' => ['option' => 'inside'],
            ]
        );

        // Create shipping method for "Outside Dhaka"
        ShippingMethod::firstOrCreate(
            ['code' => 'outside_dhaka'],
            [
                'name' => 'ঢাকার বাহিরে',
                'code' => 'outside_dhaka',
                'carrier' => 'Local Delivery',
                'description' => 'Delivery outside Dhaka city',
                'calculation_type' => 'flat',
                'base_rate' => 110.00,
                'per_kg_rate' => null,
                'per_item_rate' => null,
                'free_shipping_threshold' => null,
                'max_weight_kg' => null,
                'estimated_days' => 2,
                'is_active' => true,
                'sort_order' => 2,
                'config' => ['option' => 'outside'],
            ]
        );

        $this->command->info('Shipping methods seeded successfully!');
    }
}
