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
use App\Models\Attribute\ProductVariant;
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
     * Supports both authenticated users and guest orders.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $query = Order::with(['billingAddress', 'shippingAddress', 'shippingMethod', 'items']);

        if ($user) {
            // Authenticated user - only show their own orders
            $order = $query->where('user_id', $user->id)->findOrFail($id);
        } else {
            // Guest user - only show guest orders (user_id is null)
            $order = $query->whereNull('user_id')->findOrFail($id);
        }

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Create order from cart (checkout).
     * Supports both authenticated users and guest checkout.
     *
     * @param CreateOrderRequest $request
     * @return JsonResponse
     */
    public function store(CreateOrderRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $user = $request->user();
            $isGuest = !$user;

            if ($isGuest) {
                // Guest checkout flow
                // Create addresses on the fly
                $billingAddress = Address::create([
                    'user_id' => null,
                    'name' => $request->billing_address['name'],
                    'contact_name' => $request->billing_address['contact_name'] ?? null,
                    'phone' => $request->billing_address['phone'] ?? null,
                    'line1' => $request->billing_address['line1'],
                    'line2' => $request->billing_address['line2'] ?? null,
                    'city' => $request->billing_address['city'],
                    'state_region' => $request->billing_address['state_region'] ?? null,
                    'postal_code' => $request->billing_address['postal_code'] ?? null,
                    'country_code' => $request->billing_address['country_code'],
                ]);

                $shippingAddress = Address::create([
                    'user_id' => null,
                    'name' => $request->shipping_address['name'],
                    'contact_name' => $request->shipping_address['contact_name'] ?? null,
                    'phone' => $request->shipping_address['phone'] ?? null,
                    'line1' => $request->shipping_address['line1'],
                    'line2' => $request->shipping_address['line2'] ?? null,
                    'city' => $request->shipping_address['city'],
                    'state_region' => $request->shipping_address['state_region'] ?? null,
                    'postal_code' => $request->shipping_address['postal_code'] ?? null,
                    'country_code' => $request->shipping_address['country_code'],
                ]);

                // Calculate subtotal from cart items
                $subtotal = 0;
                $cartItems = [];
                foreach ($request->cart_items as $item) {
                    $variant = ProductVariant::with('product')->findOrFail($item['variant_id']);
                    $quantity = $item['quantity'];
                    $unitPrice = $item['unit_price'];
                    $lineTotal = $quantity * $unitPrice;
                    $subtotal += $lineTotal;

                    $cartItems[] = [
                        'variant' => $variant,
                        'qty' => $quantity,
                        'unit_price' => $unitPrice,
                        'line_total' => $lineTotal,
                    ];
                }

                $currency = $request->currency ?? 'BDT';
            } else {
                // Authenticated user flow
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

                $subtotal = $cart->subtotal;
                $currency = $cart->currency;
                $cartItems = $cart->items;
            }

            // Get shipping method if provided
            $shippingMethod = null;
            $shippingTotal = 0;
            $shippingOption = null;

            // Use provided shipping_cost if available, otherwise calculate from shipping_method_id
            if ($request->has('shipping_cost') && $request->shipping_cost !== null) {
                $shippingTotal = (float) $request->shipping_cost;
                $shippingOption = $request->shipping_option ?? null; // 'inside' or 'outside'
            } elseif ($request->shipping_method_id) {
                $shippingMethod = ShippingMethod::where('is_active', true)
                    ->findOrFail($request->shipping_method_id);

                // Calculate shipping cost (simplified - can be enhanced)
                if ($shippingMethod->isFreeShippingForAmount($subtotal)) {
                    $shippingTotal = 0;
                } else {
                    $shippingTotal = $shippingMethod->base_rate ?? 0;
                    // Add weight-based or item-based calculations if needed
                }
            }

            // Calculate totals
            $discountTotal = 0; // Can be calculated from coupons/discounts
            $taxTotal = 0; // Can be calculated based on tax rules
            $grandTotal = $subtotal - $discountTotal + $shippingTotal + $taxTotal;

            // Generate unique order number
            $orderNumber = $this->generateOrderNumber();

            // Create order
            $order = Order::create([
                'user_id' => $user?->id,
                'order_number' => $orderNumber,
                'status' => 'pending',
                'currency' => $currency,
                'subtotal' => $subtotal,
                'discount_total' => $discountTotal,
                'shipping_total' => $shippingTotal,
                'tax_total' => $taxTotal,
                'grand_total' => $grandTotal,
                'billing_address_id' => $billingAddress->id,
                'shipping_address_id' => $shippingAddress->id,
                'shipping_method_id' => $shippingMethod?->id,
                'shipping_option' => $shippingOption,
                'placed_at' => now(),
            ]);

            // Create order items from cart items
            foreach ($cartItems as $cartItem) {
                $variant = $isGuest ? $cartItem['variant'] : $cartItem->variant;
                $product = $variant->product;

                OrderItem::create([
                    'order_id' => $order->id,
                    'variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'variant_sku' => $variant->sku,
                    'qty' => $isGuest ? $cartItem['qty'] : $cartItem->qty,
                    'unit_price' => $isGuest ? $cartItem['unit_price'] : $cartItem->unit_price,
                    'discount_total' => 0,
                    'tax_total' => 0,
                    'total' => $isGuest ? $cartItem['line_total'] : $cartItem->line_total,
                ]);
            }

            // Mark cart as converted (only for authenticated users)
            if (!$isGuest && isset($cart)) {
                $cart->update(['status' => 'converted']);
            }

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
