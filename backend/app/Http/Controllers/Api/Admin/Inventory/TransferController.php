<?php

namespace App\Http\Controllers\Api\Admin\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Inventory\TransferStoreRequest;
use App\Http\Requests\Admin\Inventory\TransferUpdateRequest;
use App\Http\Resources\Admin\Inventory\TransferResource;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryMovement;
use App\Models\Inventory\Transfer;
use App\Models\Inventory\TransferItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    /**
     * List all transfers with pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transfer::query();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by warehouse
        if ($request->has('from_warehouse_id')) {
            $query->where('from_warehouse_id', $request->from_warehouse_id);
        }

        if ($request->has('to_warehouse_id')) {
            $query->where('to_warehouse_id', $request->to_warehouse_id);
        }

        // Sorting
        $sortBy = $request->get('sort', '-created_at');
        $sortDirection = str_starts_with($sortBy, '-') ? 'desc' : 'asc';
        $sortBy = ltrim($sortBy, '-');

        if (in_array($sortBy, ['status', 'created_at'])) {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Eager load relationships
        $query->with(['fromWarehouse', 'toWarehouse', 'items.variant', 'createdBy']);

        // Pagination
        $perPage = min($request->get('size', 15), 100);
        $transfers = $query->paginate($perPage);

        return TransferResource::collection($transfers)->response();
    }

    /**
     * Store a newly created transfer (draft).
     *
     * @param TransferStoreRequest $request
     * @return JsonResponse
     */
    public function store(TransferStoreRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $admin = $request->user('admin_sanctum');

            $transfer = Transfer::create([
                'from_warehouse_id' => $request->from_warehouse_id,
                'to_warehouse_id' => $request->to_warehouse_id,
                'status' => 'draft',
                'created_by' => $admin?->id,
            ]);

            // Create transfer items
            foreach ($request->items as $item) {
                TransferItem::create([
                    'transfer_id' => $transfer->id,
                    'variant_id' => $item['variant_id'],
                    'qty' => $item['qty'],
                ]);
            }

            $transfer->load(['fromWarehouse', 'toWarehouse', 'items.variant', 'createdBy']);

            return (new TransferResource($transfer))
                ->response()
                ->setStatusCode(201);
        });
    }

    /**
     * Display the specified transfer.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $transfer = Transfer::with(['fromWarehouse', 'toWarehouse', 'items.variant', 'createdBy'])
            ->findOrFail($id);

        return (new TransferResource($transfer))->response();
    }

    /**
     * Update the specified transfer (only if draft).
     *
     * @param TransferUpdateRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(TransferUpdateRequest $request, int $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $transfer = Transfer::findOrFail($id);

            if (!$transfer->isDraft()) {
                return response()->json([
                    'message' => 'Only draft transfers can be updated.',
                ], 409);
            }

            $data = $request->validated();

            // Update transfer fields
            if (isset($data['from_warehouse_id'])) {
                $transfer->from_warehouse_id = $data['from_warehouse_id'];
            }
            if (isset($data['to_warehouse_id'])) {
                $transfer->to_warehouse_id = $data['to_warehouse_id'];
            }
            $transfer->save();

            // Update items if provided
            if (isset($data['items'])) {
                $transfer->items()->delete();
                foreach ($data['items'] as $item) {
                    TransferItem::create([
                        'transfer_id' => $transfer->id,
                        'variant_id' => $item['variant_id'],
                        'qty' => $item['qty'],
                    ]);
                }
            }

            $transfer->load(['fromWarehouse', 'toWarehouse', 'items.variant', 'createdBy']);

            return (new TransferResource($transfer))->response();
        });
    }

    /**
     * Dispatch transfer (draft → in_transit).
     *
     * @param int $id
     * @return JsonResponse
     */
    public function dispatch(Request $request, int $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $transfer = Transfer::with('items')->findOrFail($id);
            $admin = $request->user('admin_sanctum');

            if (!$transfer->isDraft()) {
                return response()->json([
                    'message' => 'Only draft transfers can be dispatched.',
                ], 409);
            }

            if ($transfer->items()->count() === 0) {
                return response()->json([
                    'message' => 'Cannot dispatch transfer without items.',
                ], 422);
            }

            // Create transfer_out movements for each item
            foreach ($transfer->items as $item) {
                // Check if source warehouse has enough stock
                $inventoryItem = InventoryItem::where('variant_id', $item->variant_id)
                    ->where('warehouse_id', $transfer->from_warehouse_id)
                    ->first();

                if (!$inventoryItem || $inventoryItem->on_hand < $item->qty) {
                    return response()->json([
                        'message' => "Insufficient stock for variant {$item->variant_id} in source warehouse.",
                    ], 422);
                }

                // Create movement (but don't reduce on_hand yet - that happens on receive)
                InventoryMovement::create([
                    'variant_id' => $item->variant_id,
                    'warehouse_id' => $transfer->from_warehouse_id,
                    'qty_change' => -$item->qty,
                    'movement_type' => 'transfer_out',
                    'reference_type' => 'transfer',
                    'reference_id' => $transfer->id,
                    'performed_by' => $admin?->id,
                    'performed_at' => now(),
                ]);

                // Reduce on_hand at source warehouse
                $inventoryItem->decrement('on_hand', $item->qty);
            }

            $transfer->update(['status' => 'in_transit']);

            $transfer->load(['fromWarehouse', 'toWarehouse', 'items.variant', 'createdBy']);

            return (new TransferResource($transfer))->response();
        });
    }

    /**
     * Receive transfer (in_transit → received).
     *
     * @param int $id
     * @return JsonResponse
     */
    public function receive(Request $request, int $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $transfer = Transfer::with('items')->findOrFail($id);
            $admin = $request->user('admin_sanctum');

            if (!$transfer->isInTransit()) {
                return response()->json([
                    'message' => 'Only in-transit transfers can be received.',
                ], 409);
            }

            // Create transfer_in movements and update inventory at destination
            foreach ($transfer->items as $item) {
                // Get or create inventory item at destination
                $inventoryItem = InventoryItem::firstOrCreate(
                    [
                        'variant_id' => $item->variant_id,
                        'warehouse_id' => $transfer->to_warehouse_id,
                    ],
                    ['on_hand' => 0, 'reserved' => 0]
                );

                // Create movement
                InventoryMovement::create([
                    'variant_id' => $item->variant_id,
                    'warehouse_id' => $transfer->to_warehouse_id,
                    'qty_change' => $item->qty,
                    'movement_type' => 'transfer_in',
                    'reference_type' => 'transfer',
                    'reference_id' => $transfer->id,
                    'performed_by' => $admin?->id,
                    'performed_at' => now(),
                ]);

                // Increase on_hand at destination warehouse
                $inventoryItem->increment('on_hand', $item->qty);
            }

            $transfer->update(['status' => 'received']);

            $transfer->load(['fromWarehouse', 'toWarehouse', 'items.variant', 'createdBy']);

            return (new TransferResource($transfer))->response();
        });
    }

    /**
     * Cancel transfer (draft → canceled).
     *
     * @param int $id
     * @return JsonResponse
     */
    public function cancel(int $id): JsonResponse
    {
        $transfer = Transfer::findOrFail($id);

        if (!$transfer->isDraft()) {
            return response()->json([
                'message' => 'Only draft transfers can be canceled.',
            ], 409);
        }

        $transfer->update(['status' => 'canceled']);

        return (new TransferResource($transfer->fresh()))->response();
    }
}
