<?php

namespace App\Http\Controllers\Api\Admin\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\Inventory\InventoryItemResource;
use App\Models\Inventory\InventoryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryItemController extends Controller
{
    /**
     * List all inventory items with pagination and filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = InventoryItem::query();

        // Filter by variant
        if ($request->has('variant_id')) {
            $query->where('variant_id', $request->variant_id);
        }

        // Filter by warehouse
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Search by SKU or product name
        if ($request->has('q')) {
            $query->whereHas('variant', function ($q) use ($request) {
                $q->where('sku', 'like', '%' . $request->q . '%')
                    ->orWhereHas('product', function ($pq) use ($request) {
                        $pq->where('name', 'like', '%' . $request->q . '%');
                    });
            });
        }

        // Filter by below safety stock
        if ($request->boolean('below_safety')) {
            $query->whereRaw('on_hand < safety_stock');
        }

        // Filter by needs reorder
        if ($request->boolean('needs_reorder')) {
            $query->whereRaw('on_hand <= reorder_point');
        }

        // Sorting
        $sortBy = $request->get('sort', '-on_hand');
        $sortDirection = str_starts_with($sortBy, '-') ? 'desc' : 'asc';
        $sortBy = ltrim($sortBy, '-');

        if (in_array($sortBy, ['on_hand', 'reserved', 'available', 'created_at'])) {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Eager load relationships
        $query->with(['variant.product', 'warehouse']);

        // Pagination
        $perPage = min($request->get('size', 15), 100);
        $items = $query->paginate($perPage);

        return InventoryItemResource::collection($items)->response();
    }

    /**
     * Display the specified inventory item.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $item = InventoryItem::with(['variant.product', 'warehouse'])->findOrFail($id);

        return (new InventoryItemResource($item))->response();
    }
}
