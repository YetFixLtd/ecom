<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Client\BrandResource;
use App\Models\Catalog\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Brand Controller
 *
 * Handles brand listing for clients.
 */
class BrandController extends Controller
{
    /**
     * List all brands.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Brand::query();

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Sorting
        $sortBy = $request->get('sort', 'name');
        $sortOrder = $request->get('order', 'asc');

        if (in_array($sortBy, ['name', 'slug'])) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('name', 'asc');
        }

        $brands = $query->get();

        return response()->json([
            'data' => BrandResource::collection($brands),
        ]);
    }

    /**
     * Show a specific brand.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        // Count published products for this brand
        $brand->loadCount([
            'products' => function ($q) {
                $q->where('published_status', 'published')
                    ->where('is_active', true);
            },
        ]);

        return response()->json([
            'data' => new BrandResource($brand),
        ]);
    }
}
