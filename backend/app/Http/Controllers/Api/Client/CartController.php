<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\AddToCartRequest;
use App\Http\Requests\Client\UpdateCartItemRequest;
use App\Http\Resources\Client\CartResource;
use App\Models\Attribute\ProductVariant;
use App\Models\Inventory\InventoryItem;
use App\Models\Order\Cart;
use App\Models\Order\CartItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Cart Controller
 *
 * Handles shopping cart management for authenticated users.
 */
class CartController extends Controller
{
    /**
     * Get the user's cart.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get or create cart
        $cart = Cart::firstOrCreate(
            [
                'user_id' => $user->id,
                'status' => 'open',
            ],
            [
                'currency' => 'USD', // Default currency, can be made configurable
            ]
        );

        // Load relationships
        $cart->load([
            'items.variant.product.primaryImage',
            'items.variant.product.images',
        ]);

        return response()->json([
            'data' => new CartResource($cart),
        ]);
    }

    /**
     * Add item to cart.
     *
     * @param AddToCartRequest $request
     * @return JsonResponse
     */
    public function addItem(AddToCartRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $user = $request->user();
            $variant = ProductVariant::findOrFail($request->variant_id);

            // Check if variant is active
            if ($variant->status !== 'active') {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => [
                        'variant_id' => ['This variant is not available.'],
                    ],
                ], 422);
            }

            // Check inventory if stock is tracked
            if ($variant->track_stock) {
                $totalAvailable = InventoryItem::where('variant_id', $variant->id)
                    ->sum(DB::raw('on_hand - reserved'));

                if ($totalAvailable < $request->quantity && !$variant->allow_backorder) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors' => [
                            'quantity' => ['Insufficient stock available.'],
                        ],
                    ], 422);
                }
            }

            // Get or create cart
            $cart = Cart::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'status' => 'open',
                ],
                [
                    'currency' => $variant->currency ?? 'USD',
                ]
            );

            // Check if item already exists in cart
            $cartItem = CartItem::where('cart_id', $cart->id)
                ->where('variant_id', $variant->id)
                ->first();

            if ($cartItem) {
                // Update quantity
                $newQuantity = $cartItem->qty + $request->quantity;

                // Check inventory again if stock is tracked
                if ($variant->track_stock && !$variant->allow_backorder) {
                    $totalAvailable = InventoryItem::where('variant_id', $variant->id)
                        ->sum(DB::raw('on_hand - reserved'));

                    if ($totalAvailable < $newQuantity) {
                        return response()->json([
                            'message' => 'Validation failed.',
                            'errors' => [
                                'quantity' => ['Insufficient stock available.'],
                            ],
                        ], 422);
                    }
                }

                $cartItem->update(['qty' => $newQuantity]);
            } else {
                // Create new cart item
                $cartItem = CartItem::create([
                    'cart_id' => $cart->id,
                    'variant_id' => $variant->id,
                    'qty' => $request->quantity,
                    'unit_price' => $variant->price,
                ]);
            }

            // Reload relationships
            $cart->load([
                'items.variant.product.primaryImage',
                'items.variant.product.images',
            ]);

            return response()->json([
                'message' => 'Item added to cart successfully.',
                'data' => new CartResource($cart->fresh()),
            ], 201);
        });
    }

    /**
     * Update cart item quantity.
     *
     * @param UpdateCartItemRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateItem(UpdateCartItemRequest $request, int $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $user = $request->user();

            // Get cart item and verify it belongs to user's cart
            $cartItem = CartItem::whereHas('cart', function ($q) use ($user) {
                $q->where('user_id', $user->id)->where('status', 'open');
            })->findOrFail($id);

            $variant = $cartItem->variant;

            // Check inventory if stock is tracked
            if ($variant->track_stock && !$variant->allow_backorder) {
                $totalAvailable = InventoryItem::where('variant_id', $variant->id)
                    ->sum(DB::raw('on_hand - reserved'));

                if ($totalAvailable < $request->quantity) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors' => [
                            'quantity' => ['Insufficient stock available.'],
                        ],
                    ], 422);
                }
            }

            $cartItem->update(['qty' => $request->quantity]);

            // Reload cart with relationships
            $cart = $cartItem->cart;
            $cart->load([
                'items.variant.product.primaryImage',
                'items.variant.product.images',
            ]);

            return response()->json([
                'message' => 'Cart item updated successfully.',
                'data' => new CartResource($cart->fresh()),
            ]);
        });
    }

    /**
     * Remove item from cart.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function removeItem(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        // Get cart item and verify it belongs to user's cart
        $cartItem = CartItem::whereHas('cart', function ($q) use ($user) {
            $q->where('user_id', $user->id)->where('status', 'open');
        })->findOrFail($id);

        $cart = $cartItem->cart;
        $cartItem->delete();

        // Reload cart with relationships
        $cart->load([
            'items.variant.product.primaryImage',
            'items.variant.product.images',
        ]);

        return response()->json([
            'message' => 'Item removed from cart successfully.',
            'data' => new CartResource($cart->fresh()),
        ]);
    }

    /**
     * Clear entire cart.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function clear(Request $request): JsonResponse
    {
        $user = $request->user();

        $cart = Cart::where('user_id', $user->id)
            ->where('status', 'open')
            ->first();

        if ($cart) {
            $cart->items()->delete();
        }

        return response()->json([
            'message' => 'Cart cleared successfully.',
        ]);
    }
}
