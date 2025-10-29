<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BrandStoreRequest;
use App\Http\Requests\Admin\BrandUpdateRequest;
use App\Http\Resources\Admin\BrandResource;
use App\Models\Catalog\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    /**
     * List all brands with pagination and filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Brand::query();

        // Search by name
        if ($request->has('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        // Sorting
        $sortBy = $request->get('sort', 'created_at');
        $sortDirection = str_starts_with($sortBy, '-') ? 'desc' : 'asc';
        $sortBy = ltrim($sortBy, '-');

        if (in_array($sortBy, ['name', 'slug', 'created_at', 'updated_at'])) {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Pagination
        $perPage = min($request->get('size', 15), 100);
        $brands = $query->paginate($perPage);

        return BrandResource::collection($brands)->response();
    }

    /**
     * Store a newly created brand.
     *
     * @param BrandStoreRequest $request
     * @return JsonResponse
     */
    public function store(BrandStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $brand = Brand::create($data);

        return (new BrandResource($brand))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified brand.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $brand = Brand::withCount('products')->findOrFail($id);

        return (new BrandResource($brand))->response();
    }

    /**
     * Update the specified brand.
     *
     * @param BrandUpdateRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(BrandUpdateRequest $request, int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);
        $data = $request->validated();

        // Generate slug if name changed and slug not provided
        if (isset($data['name']) && !isset($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $brand->update($data);

        return (new BrandResource($brand->fresh()))->response();
    }

    /**
     * Remove the specified brand.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);
        $brand->delete();

        return response()->json(['message' => 'Brand deleted successfully'], 200);
    }
}
