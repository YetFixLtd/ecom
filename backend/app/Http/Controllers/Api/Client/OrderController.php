<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Requests\Client\CreateOrderRequest;
use App\Http\Resources\Client\OrderResource;
use App\Models\Order\Cart;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Models\Order\ShippingMethod;
use App\Models\User\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Order Controller
 *
 * Handles order management and checkout for authenticated users.
 */
class OrderController extends Controller
{
    /**
     * List user's orders.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Order::where('user_id', $user->id)
            ->with(['billingAddress', 'shippingAddress', 'shippingMethod', 'items'])
            ->orderBy('created_at', 'desc');

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Pagination
        $perPage = min($request->get('per_page', 15), 100);
        $orders = $query->paginate($perPage);

        return response()->json([
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    /**
     * Show a specific order.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $order = Order::where('user_id', $user->id)
            ->with(['billingAddress', 'shippingAddress', 'shippingMethod', 'items'])
            ->findOrFail($id);

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Create order from cart (checkout).
     *
     * @param CreateOrderRequest $request
     * @return JsonResponse
     */
    public function store(CreateOrderRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $user = $request->user();

            // Get user's open cart
            $cart = Cart::where('user_id', $user->id)
                ->where('status', 'open')
                ->with(['items.variant.product'])
                ->first();

            if (!$cart) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => [
                        'cart' => ['No active cart found.'],
                    ],
                ], 422);
            }

            if ($cart->items->isEmpty()) {
                return response()->json([
                    'message' => 'Validation failed.',
                    'errors' => [
                        'cart' => ['Cart is empty.'],
                    ],
                ], 422);
            }

            // Verify addresses belong to user
            $billingAddress = Address::where('user_id', $user->id)
                ->findOrFail($request->billing_address_id);

            $shippingAddress = Address::where('user_id', $user->id)
                ->findOrFail($request->shipping_address_id);

            // Get shipping method if provided
            $shippingMethod = null;
            $shippingTotal = 0;

            if ($request->shipping_method_id) {
                $shippingMethod = ShippingMethod::where('is_active', true)
                    ->findOrFail($request->shipping_method_id);

                // Calculate shipping cost (simplified - can be enhanced)
                $subtotal = $cart->subtotal;
                if ($shippingMethod->isFreeShippingForAmount($subtotal)) {
                    $shippingTotal = 0;
                } else {
                    $shippingTotal = $shippingMethod->base_rate ?? 0;
                    // Add weight-based or item-based calculations if needed
                }
            }

            // Calculate totals
            $subtotal = $cart->subtotal;
            $discountTotal = 0; // Can be calculated from coupons/discounts
            $taxTotal = 0; // Can be calculated based on tax rules
            $grandTotal = $subtotal - $discountTotal + $shippingTotal + $taxTotal;

            // Generate unique order number
            $orderNumber = $this->generateOrderNumber();

            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'currency' => $cart->currency,
                'subtotal' => $subtotal,
                'discount_total' => $discountTotal,
                'shipping_total' => $shippingTotal,
                'tax_total' => $taxTotal,
                'grand_total' => $grandTotal,
                'billing_address_id' => $billingAddress->id,
                'shipping_address_id' => $shippingAddress->id,
                'shipping_method_id' => $shippingMethod?->id,
                'placed_at' => now(),
            ]);

            // Create order items from cart items
            foreach ($cart->items as $cartItem) {
                $variant = $cartItem->variant;
                $product = $variant->product;

                OrderItem::create([
                    'order_id' => $order->id,
                    'variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'variant_sku' => $variant->sku,
                    'qty' => $cartItem->qty,
                    'unit_price' => $cartItem->unit_price,
                    'discount_total' => 0,
                    'tax_total' => 0,
                    'total' => $cartItem->line_total,
                ]);
            }

            // Mark cart as converted
            $cart->update(['status' => 'converted']);

            // Load relationships
            $order->load(['billingAddress', 'shippingAddress', 'shippingMethod', 'items']);

            return response()->json([
                'message' => 'Order created successfully.',
                'data' => new OrderResource($order),
            ], 201);
        });
    }

    /**
     * Generate a unique order number.
     *
     * @return string
     */
    private function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'ORD-' . strtoupper(uniqid());
        } while (Order::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }
}
