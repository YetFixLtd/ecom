<?php

namespace Database\Factories\Order;

use App\Models\Order\Order;
use App\Models\User;
use App\Models\User\Address;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order\Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 50, 1000);
        $discountTotal = fake()->randomFloat(2, 0, $subtotal * 0.2);
        $shippingTotal = fake()->randomFloat(2, 0, 50);
        $taxTotal = fake()->randomFloat(2, 0, $subtotal * 0.1);
        $grandTotal = $subtotal - $discountTotal + $shippingTotal + $taxTotal;

        return [
            'user_id' => User::factory(),
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => fake()->randomElement(['pending', 'paid', 'fulfilled', 'canceled']),
            'currency' => 'USD',
            'subtotal' => $subtotal,
            'discount_total' => $discountTotal,
            'shipping_total' => $shippingTotal,
            'tax_total' => $taxTotal,
            'grand_total' => $grandTotal,
            'billing_address_id' => Address::factory(),
            'shipping_address_id' => Address::factory(),
            'placed_at' => fake()->optional()->dateTimeBetween('-1 year', 'now'),
        ];
    }
}

