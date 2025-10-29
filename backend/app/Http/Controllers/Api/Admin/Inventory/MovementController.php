<?php

namespace App\Http\Controllers\Api\Admin\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\Inventory\InventoryMovementResource;
use App\Models\Inventory\InventoryMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MovementController extends Controller
{
    /**
     * List all inventory movements with pagination and filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = InventoryMovement::query();

        // Filter by variant
        if ($request->has('variant_id')) {
            $query->where('variant_id', $request->variant_id);
        }

        // Filter by warehouse
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        // Filter by movement type
        if ($request->has('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        // Filter by performed by
        if ($request->has('performed_by')) {
            $query->where('performed_by', $request->performed_by);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('performed_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('performed_at', '<=', $request->date_to);
        }

        // Filter by reference
        if ($request->has('reference_type')) {
            $query->where('reference_type', $request->reference_type);
        }

        if ($request->has('reference_id')) {
            $query->where('reference_id', $request->reference_id);
        }

        // Sorting
        $sortBy = $request->get('sort', '-performed_at');
        $sortDirection = str_starts_with($sortBy, '-') ? 'desc' : 'asc';
        $sortBy = ltrim($sortBy, '-');

        if (in_array($sortBy, ['performed_at', 'created_at', 'qty_change'])) {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Eager load relationships
        $query->with(['variant.product', 'warehouse', 'performedBy']);

        // Pagination
        $perPage = min($request->get('size', 15), 100);
        $movements = $query->paginate($perPage);

        return InventoryMovementResource::collection($movements)->response();
    }
}
