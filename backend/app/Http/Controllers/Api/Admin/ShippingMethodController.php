<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ShippingMethodStoreRequest;
use App\Http\Requests\Admin\ShippingMethodUpdateRequest;
use App\Http\Resources\Admin\ShippingMethodResource;
use App\Models\Order\ShippingMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingMethodController extends Controller
{
    /**
     * List all shipping methods with pagination and filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = ShippingMethod::query();

        // Search by name or code
        if ($request->has('q')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                  ->orWhere('code', 'like', '%' . $request->q . '%');
            });
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Sorting
        $sortBy = $request->get('sort', 'sort_order');
        $sortDirection = str_starts_with($sortBy, '-') ? 'desc' : 'asc';
        $sortBy = ltrim($sortBy, '-');

        if (in_array($sortBy, ['name', 'code', 'base_rate', 'sort_order', 'is_active', 'created_at', 'updated_at'])) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('sort_order')->orderBy('name');
        }

        // Pagination
        $perPage = min($request->get('size', 15), 100);
        $methods = $query->paginate($perPage);

        return ShippingMethodResource::collection($methods)->response();
    }

    /**
     * Store a newly created shipping method.
     *
     * @param ShippingMethodStoreRequest $request
     * @return JsonResponse
     */
    public function store(ShippingMethodStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Ensure code is unique
        if (ShippingMethod::where('code', $data['code'])->exists()) {
            return response()->json([
                'message' => 'A shipping method with this code already exists.',
            ], 422);
        }

        $method = ShippingMethod::create($data);

        return (new ShippingMethodResource($method))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified shipping method.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $method = ShippingMethod::withCount('orders')->findOrFail($id);

        return (new ShippingMethodResource($method))->response();
    }

    /**
     * Update the specified shipping method.
     *
     * @param ShippingMethodUpdateRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(ShippingMethodUpdateRequest $request, int $id): JsonResponse
    {
        $method = ShippingMethod::findOrFail($id);
        $data = $request->validated();

        // Check if code is being changed and if it's unique
        if (isset($data['code']) && $data['code'] !== $method->code) {
            if (ShippingMethod::where('code', $data['code'])->where('id', '!=', $id)->exists()) {
                return response()->json([
                    'message' => 'A shipping method with this code already exists.',
                ], 422);
            }
        }

        $method->update($data);

        return (new ShippingMethodResource($method->fresh()))->response();
    }

    /**
     * Remove the specified shipping method.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $method = ShippingMethod::findOrFail($id);

        // Check if method is used in any orders
        if ($method->orders()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete shipping method that has been used in orders. You can deactivate it instead.',
            ], 422);
        }

        $method->delete();

        return response()->json([
            'message' => 'Shipping method deleted successfully.',
        ]);
    }
}
