<?php

namespace App\Http\Controllers\Api\Admin\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Inventory\ReservationRequest;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReservationController extends Controller
{
    /**
     * Reserve stock for an order or other reference.
     *
     * @param ReservationRequest $request
     * @return JsonResponse
     */
    public function reserve(ReservationRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $admin = $request->user('admin_sanctum');
            $data = $request->validated();

            // Get or create inventory item
            $inventoryItem = InventoryItem::firstOrCreate(
                [
                    'variant_id' => $data['variant_id'],
                    'warehouse_id' => $data['warehouse_id'],
                ],
                ['on_hand' => 0, 'reserved' => 0]
            );

            // Check available stock
            $available = $inventoryItem->on_hand - $inventoryItem->reserved;
            if ($available < $data['qty']) {
                return response()->json([
                    'message' => 'Insufficient available stock. Available: ' . $available . ', Requested: ' . $data['qty'],
                ], 422);
            }

            // Increase reserved quantity
            $inventoryItem->increment('reserved', $data['qty']);

            // Create movement record
            InventoryMovement::create([
                'variant_id' => $data['variant_id'],
                'warehouse_id' => $data['warehouse_id'],
                'qty_change' => 0, // Reservation doesn't change on_hand
                'movement_type' => 'reservation',
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'note' => $data['note'] ?? null,
                'performed_by' => $admin?->id,
                'performed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Stock reserved successfully',
                'inventory_item' => [
                    'on_hand' => $inventoryItem->fresh()->on_hand,
                    'reserved' => $inventoryItem->fresh()->reserved,
                    'available' => $inventoryItem->fresh()->available,
                ],
            ], 200);
        });
    }

    /**
     * Release reserved stock.
     *
     * @param ReservationRequest $request
     * @return JsonResponse
     */
    public function release(ReservationRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $admin = $request->user('admin_sanctum');
            $data = $request->validated();

            $inventoryItem = InventoryItem::where('variant_id', $data['variant_id'])
                ->where('warehouse_id', $data['warehouse_id'])
                ->firstOrFail();

            // Check if enough reserved to release
            if ($inventoryItem->reserved < $data['qty']) {
                return response()->json([
                    'message' => 'Insufficient reserved stock. Reserved: ' . $inventoryItem->reserved . ', Requested: ' . $data['qty'],
                ], 422);
            }

            // Decrease reserved quantity
            $inventoryItem->decrement('reserved', $data['qty']);

            // Create movement record
            InventoryMovement::create([
                'variant_id' => $data['variant_id'],
                'warehouse_id' => $data['warehouse_id'],
                'qty_change' => 0, // Release doesn't change on_hand
                'movement_type' => 'release',
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'note' => $data['note'] ?? null,
                'performed_by' => $admin?->id,
                'performed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Stock released successfully',
                'inventory_item' => [
                    'on_hand' => $inventoryItem->fresh()->on_hand,
                    'reserved' => $inventoryItem->fresh()->reserved,
                    'available' => $inventoryItem->fresh()->available,
                ],
            ], 200);
        });
    }
}
