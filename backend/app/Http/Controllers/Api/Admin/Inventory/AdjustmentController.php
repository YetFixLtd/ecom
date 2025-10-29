<?php

namespace App\Http\Controllers\Api\Admin\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Inventory\AdjustmentStoreRequest;
use App\Http\Resources\Admin\Inventory\InventoryAdjustmentResource;
use App\Models\Inventory\InventoryAdjustment;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdjustmentController extends Controller
{
    /**
     * Store a newly created stock adjustment.
     *
     * @param AdjustmentStoreRequest $request
     * @return JsonResponse
     */
    public function store(AdjustmentStoreRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();
            $admin = $request->user('admin_sanctum');

            // Get or create inventory item
            $inventoryItem = InventoryItem::firstOrCreate(
                [
                    'variant_id' => $data['variant_id'],
                    'warehouse_id' => $data['warehouse_id'],
                ],
                ['on_hand' => 0, 'reserved' => 0]
            );

            $qtyBefore = $inventoryItem->on_hand;
            $qtyAfter = 0;
            $qtyChange = 0;

            // Calculate quantities based on adjustment mode
            if ($data['adjustment_mode'] === 'SET_ON_HAND') {
                $qtyAfter = $data['qty'];
                $qtyChange = $qtyAfter - $qtyBefore;
            } else { // DELTA_ON_HAND
                $qtyChange = $data['qty'];
                $qtyAfter = $qtyBefore + $qtyChange;
            }

            // Update inventory item
            $inventoryItem->update(['on_hand' => $qtyAfter]);

            // Create adjustment record
            $adjustment = InventoryAdjustment::create([
                'variant_id' => $data['variant_id'],
                'warehouse_id' => $data['warehouse_id'],
                'adjustment_mode' => $data['adjustment_mode'],
                'qty_before' => $qtyBefore,
                'qty_change' => $qtyChange,
                'qty_after' => $qtyAfter,
                'unit_cost' => $data['unit_cost'] ?? null,
                'reason_code' => $data['reason_code'] ?? null,
                'note' => $data['note'] ?? null,
                'performed_by' => $admin?->id,
                'performed_at' => now(),
            ]);

            // Create movement record for audit trail
            InventoryMovement::create([
                'variant_id' => $data['variant_id'],
                'warehouse_id' => $data['warehouse_id'],
                'qty_change' => $qtyChange,
                'movement_type' => 'adjustment',
                'reference_type' => 'inventory_adjustment',
                'reference_id' => $adjustment->id,
                'unit_cost' => $data['unit_cost'] ?? null,
                'reason_code' => $data['reason_code'] ?? null,
                'note' => $data['note'] ?? null,
                'performed_by' => $admin?->id,
                'performed_at' => now(),
            ]);

            $adjustment->load(['variant.product', 'warehouse', 'performedBy']);

            return (new InventoryAdjustmentResource($adjustment))
                ->response()
                ->setStatusCode(201);
        });
    }
}
