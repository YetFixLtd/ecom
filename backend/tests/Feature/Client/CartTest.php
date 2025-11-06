<?php

namespace Tests\Feature\Client;

use App\Models\User;
use App\Models\Catalog\Product;
use App\Models\Attribute\ProductVariant;
use App\Models\Order\Cart;
use App\Models\Order\CartItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user can get their cart.
     */
    public function test_user_can_get_their_cart(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/cart');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'currency',
                    'status',
                    'items',
                    'subtotal',
                    'items_count',
                ],
            ]);
    }

    /**
     * Test user can add item to cart.
     */
    public function test_user_can_add_item_to_cart(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $product = Product::factory()->create([
            'published_status' => 'published',
            'is_active' => true,
        ]);
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'status' => 'active',
            'price' => 99.99,
            'track_stock' => false, // Disable stock tracking for test
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/cart/items', [
                'variant_id' => $variant->id,
                'quantity' => 2,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'items',
                ],
            ]);

        $this->assertDatabaseHas('cart_items', [
            'variant_id' => $variant->id,
            'qty' => 2,
        ]);
    }

    /**
     * Test user can update cart item quantity.
     */
    public function test_user_can_update_cart_item_quantity(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $cart = Cart::factory()->create(['user_id' => $user->id]);
        $variant = ProductVariant::factory()->create([
            'status' => 'active',
            'track_stock' => false, // Disable stock tracking for test
        ]);
        $cartItem = CartItem::factory()->create([
            'cart_id' => $cart->id,
            'variant_id' => $variant->id,
            'qty' => 1,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/cart/items/{$cartItem->id}", [
                'quantity' => 3,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Cart item updated successfully.',
            ]);

        $this->assertDatabaseHas('cart_items', [
            'id' => $cartItem->id,
            'qty' => 3,
        ]);
    }

    /**
     * Test user can remove item from cart.
     */
    public function test_user_can_remove_item_from_cart(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $cart = Cart::factory()->create(['user_id' => $user->id]);
        $variant = ProductVariant::factory()->create([
            'status' => 'active',
            'track_stock' => false, // Disable stock tracking for test
        ]);
        $cartItem = CartItem::factory()->create([
            'cart_id' => $cart->id,
            'variant_id' => $variant->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/cart/items/{$cartItem->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Item removed from cart successfully.',
            ]);

        $this->assertDatabaseMissing('cart_items', ['id' => $cartItem->id]);
    }

    /**
     * Test user can clear cart.
     */
    public function test_user_can_clear_cart(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $cart = Cart::factory()->create(['user_id' => $user->id]);
        CartItem::factory()->count(3)->create(['cart_id' => $cart->id]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson('/api/v1/cart');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Cart cleared successfully.',
            ]);

        $this->assertEquals(0, $cart->items()->count());
    }

    /**
     * Test unauthenticated user cannot access cart.
     */
    public function test_unauthenticated_user_cannot_access_cart(): void
    {
        $response = $this->getJson('/api/v1/cart');

        $response->assertStatus(401);
    }

    /**
     * Test adding inactive variant fails.
     */
    public function test_adding_inactive_variant_fails(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $variant = ProductVariant::factory()->create([
            'status' => 'inactive',
            'track_stock' => false, // Disable stock tracking for test
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/cart/items', [
                'variant_id' => $variant->id,
                'quantity' => 1,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['variant_id']);
    }
}
