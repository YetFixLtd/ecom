<?php

namespace Database\Factories\Order;

use App\Models\Attribute\ProductVariant;
use App\Models\Order\Cart;
use App\Models\Order\CartItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order\CartItem>
 */
class CartItemFactory extends Factory
{
    protected $model = CartItem::class;

    public function definition(): array
    {
        return [
            'cart_id' => Cart::factory(),
            'variant_id' => ProductVariant::factory(),
            'qty' => fake()->numberBetween(1, 5),
            'unit_price' => fake()->randomFloat(2, 10, 1000),
        ];
    }
}

