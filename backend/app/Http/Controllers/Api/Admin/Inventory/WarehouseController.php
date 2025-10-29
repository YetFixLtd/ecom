<?php

namespace App\Http\Controllers\Api\Admin\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Inventory\WarehouseStoreRequest;
use App\Http\Requests\Admin\Inventory\WarehouseUpdateRequest;
use App\Http\Resources\Admin\Inventory\WarehouseResource;
use App\Models\Inventory\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WarehouseController extends Controller
{
    /**
     * List all warehouses with pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Warehouse::query();

        // Search by name or code
        if ($request->has('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                    ->orWhere('code', 'like', '%' . $request->q . '%');
            });
        }

        // Filter by default
        if ($request->has('is_default')) {
            $query->where('is_default', $request->boolean('is_default'));
        }

        // Sorting
        $sortBy = $request->get('sort', 'name');
        $sortDirection = str_starts_with($sortBy, '-') ? 'desc' : 'asc';
        $sortBy = ltrim($sortBy, '-');

        if (in_array($sortBy, ['name', 'code', 'created_at'])) {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Pagination
        $perPage = min($request->get('size', 15), 100);
        $warehouses = $query->paginate($perPage);

        return WarehouseResource::collection($warehouses)->response();
    }

    /**
     * Store a newly created warehouse.
     *
     * @param WarehouseStoreRequest $request
     * @return JsonResponse
     */
    public function store(WarehouseStoreRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();

            // If setting as default, unset other defaults
            if ($data['is_default'] ?? false) {
                Warehouse::where('is_default', true)->update(['is_default' => false]);
            }

            $warehouse = Warehouse::create($data);

            return (new WarehouseResource($warehouse))
                ->response()
                ->setStatusCode(201);
        });
    }

    /**
     * Display the specified warehouse.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        return (new WarehouseResource($warehouse))->response();
    }

    /**
     * Update the specified warehouse.
     *
     * @param WarehouseUpdateRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(WarehouseUpdateRequest $request, int $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $warehouse = Warehouse::findOrFail($id);
            $data = $request->validated();

            // If setting as default, unset other defaults
            if (isset($data['is_default']) && $data['is_default']) {
                Warehouse::where('is_default', true)->where('id', '!=', $warehouse->id)->update(['is_default' => false]);
            }

            $warehouse->update($data);

            return (new WarehouseResource($warehouse->fresh()))->response();
        });
    }

    /**
     * Remove the specified warehouse.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        // Check if warehouse has inventory items
        if ($warehouse->inventoryItems()->exists()) {
            return response()->json([
                'message' => 'Cannot delete warehouse with inventory items. Please transfer or remove inventory first.',
            ], 409);
        }

        $warehouse->delete();

        return response()->json(['message' => 'Warehouse deleted successfully'], 200);
    }
}
