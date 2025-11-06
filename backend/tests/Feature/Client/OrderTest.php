<?php

namespace Tests\Feature\Client;

use App\Models\User;
use App\Models\User\Address;
use App\Models\Catalog\Product;
use App\Models\Attribute\ProductVariant;
use App\Models\Order\Cart;
use App\Models\Order\CartItem;
use App\Models\Order\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user can list their orders.
     */
    public function test_user_can_list_their_orders(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        Order::factory()->count(3)->create(['user_id' => $user->id]);
        Order::factory()->count(2)->create(); // Other user's orders

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/orders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'order_number',
                        'status',
                        'grand_total',
                    ],
                ],
                'meta',
            ]);

        // Should only return user's orders
        $this->assertCount(3, $response->json('data'));
    }

    /**
     * Test user can view their order.
     */
    public function test_user_can_view_their_order(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $order = Order::factory()->create(['user_id' => $user->id]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/orders/{$order->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'status',
                    'subtotal',
                    'grand_total',
                    'items',
                ],
            ])
            ->assertJson([
                'data' => [
                    'id' => $order->id,
                ],
            ]);
    }

    /**
     * Test user cannot view other user's order.
     */
    public function test_user_cannot_view_other_users_order(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $order = Order::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/orders/{$order->id}");

        $response->assertStatus(404);
    }

    /**
     * Test user can create order from cart.
     */
    public function test_user_can_create_order_from_cart(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $billingAddress = Address::factory()->create(['user_id' => $user->id]);
        $shippingAddress = Address::factory()->create(['user_id' => $user->id]);

        $cart = Cart::factory()->create(['user_id' => $user->id, 'status' => 'open']);
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'variant_id' => $variant->id,
            'qty' => 2,
            'unit_price' => 99.99,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/orders', [
                'billing_address_id' => $billingAddress->id,
                'shipping_address_id' => $shippingAddress->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'order_number',
                    'status',
                    'grand_total',
                ],
            ]);

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'status' => 'pending',
        ]);

        // Cart should be marked as converted
        $this->assertDatabaseHas('carts', [
            'id' => $cart->id,
            'status' => 'converted',
        ]);
    }

    /**
     * Test creating order fails with empty cart.
     */
    public function test_creating_order_fails_with_empty_cart(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $billingAddress = Address::factory()->create(['user_id' => $user->id]);
        $shippingAddress = Address::factory()->create(['user_id' => $user->id]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/orders', [
                'billing_address_id' => $billingAddress->id,
                'shipping_address_id' => $shippingAddress->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cart']);
    }

    /**
     * Test creating order fails with other user's address.
     */
    public function test_creating_order_fails_with_other_users_address(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $billingAddress = Address::factory()->create(['user_id' => $otherUser->id]);
        $shippingAddress = Address::factory()->create(['user_id' => $user->id]);

        $cart = Cart::factory()->create(['user_id' => $user->id, 'status' => 'open']);
        $variant = ProductVariant::factory()->create();
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'variant_id' => $variant->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/orders', [
                'billing_address_id' => $billingAddress->id,
                'shipping_address_id' => $shippingAddress->id,
            ]);

        $response->assertStatus(404);
    }

    /**
     * Test unauthenticated user cannot access orders.
     */
    public function test_unauthenticated_user_cannot_access_orders(): void
    {
        $response = $this->getJson('/api/v1/orders');

        $response->assertStatus(401);
    }
}

