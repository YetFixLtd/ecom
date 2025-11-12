<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Client\ProductResource;
use App\Models\Catalog\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Product Controller
 *
 * Handles product catalog browsing for clients.
 * Only shows published and active products.
 */
class ProductController extends Controller
{
    /**
     * List all published products with filtering and pagination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->where('published_status', 'published')
            ->where('is_active', true);

        // Search by name or description
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('short_description', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        // Filter by category
        if ($request->has('category')) {
            $query->whereHas('categories', function ($categoryQuery) use ($request) {
                $categoryQuery->where('categories.slug', $request->category)
                    ->orWhere('categories.id', $request->category);
            });
        }

        // Filter by brand
        if ($request->has('brand')) {
            $query->whereHas('brand', function ($brandQuery) use ($request) {
                $brandQuery->where('brands.slug', $request->brand)
                    ->orWhere('brands.id', $request->brand);
            });
        }

        // Filter by price range
        if ($request->has('min_price')) {
            $query->whereHas('variants', function ($variantQuery) use ($request) {
                $variantQuery->where('price', '>=', $request->min_price);
            });
        }

        if ($request->has('max_price')) {
            $query->whereHas('variants', function ($variantQuery) use ($request) {
                $variantQuery->where('price', '<=', $request->max_price);
            });
        }

        // Filter by featured
        if ($request->has('featured')) {
            $query->where('is_featured', $request->boolean('featured'));
        }

        // Sorting
        $sortBy = $request->get('sort', 'created_at');
        $sortOrder = $request->get('order', 'desc');

        $allowedSorts = ['name', 'created_at', 'sort_order'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        } elseif ($sortBy === 'price') {
            // Sort by minimum variant price (only active variants)
            $query->whereHas('variants', function ($q) {
                $q->where('status', 'active');
            })->withMin(['variants' => function ($q) {
                $q->where('status', 'active');
            }], 'price')
                ->orderBy('variants_min_price', $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Eager load relationships
        $query->with(['brand', 'categories', 'images' => function ($q) {
            $q->orderBy('position');
        }, 'variants' => function ($q) {
            $q->where('status', 'active')->orderBy('price');
        }]);

        // Pagination
        $perPage = min($request->get('per_page', 15), 100);
        $page = max($request->get('page', 1), 1); // Ensure page is at least 1
        $products = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => ProductResource::collection($products->items()),
            'meta' => [
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'last_page' => $products->lastPage(),
            ],
        ]);
    }

    /**
     * Show a specific product.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $product = Product::query()
            ->where('published_status', 'published')
            ->where('is_active', true)
            ->with([
                'brand',
                'categories',
                'images' => function ($q) {
                    $q->orderBy('position');
                },
                'variants' => function ($q) {
                    $q->where('status', 'active')
                        ->with(['inventoryItems.warehouse', 'attributeValues.attribute']);
                },
            ])
            ->findOrFail($id);

        return response()->json([
            'data' => new ProductResource($product),
        ]);
    }

    /**
     * Get product variants.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function variants(Request $request, int $id): JsonResponse
    {
        $product = Product::query()
            ->where('published_status', 'published')
            ->where('is_active', true)
            ->findOrFail($id);

        $variants = $product->variants()
            ->where('status', 'active')
            ->with(['inventoryItems.warehouse', 'attributeValues.attribute'])
            ->get();

        return response()->json([
            'data' => $variants->map(function ($variant) {
                return [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'barcode' => $variant->barcode,
                    'price' => (float) $variant->price,
                    'compare_at_price' => $variant->compare_at_price ? (float) $variant->compare_at_price : null,
                    'currency' => $variant->currency,
                    'track_stock' => $variant->track_stock,
                    'allow_backorder' => $variant->allow_backorder,
                    'inventory' => $variant->inventoryItems->map(function ($item) {
                        return [
                            'warehouse_id' => $item->warehouse_id,
                            'warehouse_name' => $item->warehouse->name ?? null,
                            'available' => $item->available,
                            'on_hand' => $item->on_hand,
                            'reserved' => $item->reserved,
                        ];
                    }),
                    'attributes' => $variant->attributeValues->map(function ($value) {
                        return [
                            'attribute_id' => $value->attribute->id ?? null,
                            'attribute_name' => $value->attribute->name ?? null,
                            'value_id' => $value->id,
                            'value' => $value->value,
                        ];
                    }),
                ];
            }),
        ]);
    }
}
