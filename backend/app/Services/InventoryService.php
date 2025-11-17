<?php

namespace App\Services;

use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryMovement;
use App\Models\Inventory\Warehouse;
use App\Models\Order\Fulfillment;
use App\Models\Order\FulfillmentItem;
use Illuminate\Support\Facades\DB;

/**
 * Inventory Service
 *
 * Handles inventory adjustments for fulfillments.
 * Deducts inventory when fulfillment is created.
 * Restores inventory when fulfillment status is "returned".
 */
class InventoryService
{
    /**
     * Deduct inventory for a fulfillment.
     * Called when fulfillment is created.
     *
     * @param Fulfillment $fulfillment
     * @param int|null $warehouseId Optional warehouse ID, uses default if not provided
     * @return void
     * @throws \Exception
     */
    public function deductInventoryForFulfillment(Fulfillment $fulfillment, ?int $warehouseId = null): void
    {
        DB::transaction(function () use ($fulfillment, $warehouseId) {
            // Get warehouse (use provided or default)
            $warehouse = $warehouseId
                ? Warehouse::findOrFail($warehouseId)
                : Warehouse::where('is_default', true)->first();

            if (!$warehouse) {
                throw new \Exception('No warehouse found. Please create a default warehouse or specify a warehouse.');
            }

            $admin = auth('admin_sanctum')->user();

            // Process each fulfillment item
            foreach ($fulfillment->items as $fulfillmentItem) {
                $orderItem = $fulfillmentItem->orderItem;
                $variantId = $orderItem->variant_id;
                $qty = $fulfillmentItem->qty;

                // Get or create inventory item
                $inventoryItem = InventoryItem::firstOrCreate(
                    [
                        'variant_id' => $variantId,
                        'warehouse_id' => $warehouse->id,
                    ],
                    [
                        'on_hand' => 0,
                        'reserved' => 0,
                    ]
                );

                // Check available stock
                $available = $inventoryItem->on_hand - $inventoryItem->reserved;
                if ($available < $qty) {
                    throw new \Exception(
                        "Insufficient stock for variant ID {$variantId}. Available: {$available}, Required: {$qty}"
                    );
                }

                // Deduct from on_hand
                $inventoryItem->decrement('on_hand', $qty);

                // Create movement record
                InventoryMovement::create([
                    'variant_id' => $variantId,
                    'warehouse_id' => $warehouse->id,
                    'qty_change' => -$qty, // Negative for deduction
                    'movement_type' => 'sale',
                    'reference_type' => 'fulfillment',
                    'reference_id' => $fulfillment->id,
                    'note' => "Fulfillment #{$fulfillment->id} - Order #{$fulfillment->order->order_number}",
                    'performed_by' => $admin?->id,
                    'performed_at' => now(),
                ]);
            }
        });
    }

    /**
     * Restore inventory for a returned fulfillment.
     * Called when fulfillment status changes to "returned".
     *
     * @param Fulfillment $fulfillment
     * @return void
     * @throws \Exception
     */
    public function restoreInventoryForReturn(Fulfillment $fulfillment): void
    {
        DB::transaction(function () use ($fulfillment) {
            // Find the warehouse used for this fulfillment
            // We'll look for movements with this fulfillment reference
            $movements = InventoryMovement::where('reference_type', 'fulfillment')
                ->where('reference_id', $fulfillment->id)
                ->where('movement_type', 'sale')
                ->get();

            if ($movements->isEmpty()) {
                // If no movements found, try to use default warehouse
                $warehouse = Warehouse::where('is_default', true)->first();
                if (!$warehouse) {
                    throw new \Exception('No warehouse found. Cannot restore inventory without warehouse information.');
                }
            } else {
                // Use the warehouse from the first movement (all should be same warehouse)
                $warehouse = $movements->first()->warehouse;
            }

            $admin = auth('admin_sanctum')->user();

            // Process each fulfillment item
            foreach ($fulfillment->items as $fulfillmentItem) {
                $orderItem = $fulfillmentItem->orderItem;
                $variantId = $orderItem->variant_id;
                $qty = $fulfillmentItem->qty;

                // Get or create inventory item
                $inventoryItem = InventoryItem::firstOrCreate(
                    [
                        'variant_id' => $variantId,
                        'warehouse_id' => $warehouse->id,
                    ],
                    [
                        'on_hand' => 0,
                        'reserved' => 0,
                    ]
                );

                // Restore to on_hand
                $inventoryItem->increment('on_hand', $qty);

                // Create movement record for return
                InventoryMovement::create([
                    'variant_id' => $variantId,
                    'warehouse_id' => $warehouse->id,
                    'qty_change' => $qty, // Positive for restoration
                    'movement_type' => 'return_in',
                    'reference_type' => 'fulfillment',
                    'reference_id' => $fulfillment->id,
                    'note' => "Returned fulfillment #{$fulfillment->id} - Order #{$fulfillment->order->order_number}",
                    'performed_by' => $admin?->id,
                    'performed_at' => now(),
                ]);
            }
        });
    }
}

