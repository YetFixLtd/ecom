<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Fulfillment\CreateFulfillmentRequest;
use App\Http\Requests\Admin\Fulfillment\UpdateFulfillmentRequest;
use App\Http\Requests\Admin\Fulfillment\UpdateFulfillmentStatusRequest;
use App\Http\Resources\Admin\FulfillmentResource;
use App\Models\Order\Fulfillment;
use App\Models\Order\FulfillmentItem;
use App\Models\Order\Order;
use App\Models\Order\OrderItem;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Admin Fulfillment Controller
 *
 * Handles fulfillment management for administrators.
 * Creates fulfillments, updates status, and manages inventory adjustments.
 */
class FulfillmentController extends Controller
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Create a new fulfillment for an order.
     *
     * @param CreateFulfillmentRequest $request
     * @param int $orderId
     * @return JsonResponse
     */
    public function store(CreateFulfillmentRequest $request, int $orderId): JsonResponse
    {
        return DB::transaction(function () use ($request, $orderId) {
            $order = Order::with('items')->findOrFail($orderId);

            // Validate that order items exist and quantities don't exceed ordered quantities
            $orderItemsById = $order->items->keyBy('id');
            $fulfilledQuantities = [];

            foreach ($request->items as $item) {
                $orderItemId = $item['order_item_id'];
                $qty = $item['qty'];

                if (!isset($orderItemsById[$orderItemId])) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors' => [
                            'items' => ["Order item ID {$orderItemId} does not belong to this order."],
                        ],
                    ], 422);
                }

                $orderItem = $orderItemsById[$orderItemId];

                // Calculate already fulfilled quantity for this order item
                $alreadyFulfilled = $orderItem->fulfillmentItems()->sum('qty');
                $remainingToFulfill = $orderItem->qty - $alreadyFulfilled;

                if ($qty > $remainingToFulfill) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors' => [
                            'items' => ["Quantity for order item ID {$orderItemId} exceeds remaining quantity. Remaining: {$remainingToFulfill}, Requested: {$qty}"],
                        ],
                    ], 422);
                }

                $fulfilledQuantities[$orderItemId] = ($fulfilledQuantities[$orderItemId] ?? 0) + $qty;
            }

            // Create fulfillment
            $fulfillment = Fulfillment::create([
                'order_id' => $orderId,
                'status' => 'pending',
                'tracking_number' => $request->tracking_number,
                'carrier' => $request->carrier,
            ]);

            // Create fulfillment items
            foreach ($request->items as $item) {
                FulfillmentItem::create([
                    'fulfillment_id' => $fulfillment->id,
                    'order_item_id' => $item['order_item_id'],
                    'qty' => $item['qty'],
                ]);
            }

            // Load relationships
            $fulfillment->load('items.orderItem');

            // Deduct inventory
            try {
                $this->inventoryService->deductInventoryForFulfillment(
                    $fulfillment,
                    $request->warehouse_id
                );
            } catch (\Exception $e) {
                // Rollback fulfillment creation if inventory deduction fails
                throw $e;
            }

            // Update shipped_at if status is shipped
            if ($fulfillment->status === 'shipped') {
                $fulfillment->update(['shipped_at' => now()]);
            }

            $fulfillment->load(['order', 'items.orderItem']);

            return response()->json([
                'message' => 'Fulfillment created successfully.',
                'data' => new FulfillmentResource($fulfillment),
            ], 201);
        });
    }

    /**
     * Show a specific fulfillment.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $fulfillment = Fulfillment::with([
            'order.user',
            'order.billingAddress',
            'order.shippingAddress',
            'items.orderItem',
        ])->findOrFail($id);

        return response()->json([
            'data' => new FulfillmentResource($fulfillment),
        ]);
    }

    /**
     * Update fulfillment details (tracking number, carrier).
     *
     * @param UpdateFulfillmentRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateFulfillmentRequest $request, int $id): JsonResponse
    {
        $fulfillment = Fulfillment::findOrFail($id);
        $fulfillment->update($request->validated());

        $fulfillment->load(['order', 'items.orderItem']);

        return response()->json([
            'message' => 'Fulfillment updated successfully.',
            'data' => new FulfillmentResource($fulfillment),
        ]);
    }

    /**
     * Update fulfillment status.
     * Handles inventory restoration when status changes to "returned".
     *
     * @param UpdateFulfillmentStatusRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateStatus(UpdateFulfillmentStatusRequest $request, int $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $fulfillment = Fulfillment::with('items.orderItem')->findOrFail($id);
            $oldStatus = $fulfillment->status;
            $newStatus = $request->status;

            // If changing to "returned", restore inventory
            if ($newStatus === 'returned' && $oldStatus !== 'returned') {
                try {
                    $this->inventoryService->restoreInventoryForReturn($fulfillment);
                } catch (\Exception $e) {
                    return response()->json([
                        'message' => 'Failed to restore inventory: ' . $e->getMessage(),
                    ], 422);
                }
            }

            // Update status
            $updateData = ['status' => $newStatus];

            // Update timestamps based on status
            if ($newStatus === 'shipped' && !$fulfillment->shipped_at) {
                $updateData['shipped_at'] = now();
            }
            if ($newStatus === 'delivered' && !$fulfillment->delivered_at) {
                $updateData['delivered_at'] = now();
            }

            $fulfillment->update($updateData);

            $fulfillment->load(['order', 'items.orderItem']);

            return response()->json([
                'message' => 'Fulfillment status updated successfully.',
                'data' => new FulfillmentResource($fulfillment),
            ]);
        });
    }
}

