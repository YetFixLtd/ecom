<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductStoreRequest;
use App\Http\Requests\Admin\ProductUpdateRequest;
use App\Http\Requests\Admin\ProductPricingUpdateRequest;
use App\Http\Requests\Admin\ProductInventoryUpdateRequest;
use App\Http\Requests\Admin\ProductAttributesSyncRequest;
use App\Http\Resources\Admin\ProductResource;
use App\Models\Catalog\Product;
use App\Models\Attribute\ProductVariant;
use App\Models\Attribute\VariantAttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * List all products with pagination and filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        // Search by name or SKU
        if ($request->has('q')) {
            $search = $request->q;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%')
                    ->orWhereHas('variants', function ($variantQuery) use ($search) {
                        $variantQuery->where('sku', 'like', '%' . $search . '%');
                    });
            });
        }

        // Filter by brand
        if ($request->has('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->whereHas('categories', function ($categoryQuery) use ($request) {
                $categoryQuery->where('categories.id', $request->category_id);
            });
        }

        // Filter by status
        if ($request->has('published_status')) {
            $query->where('published_status', $request->published_status);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by product type
        if ($request->has('product_type')) {
            $query->where('product_type', $request->product_type);
        }

        // Sorting
        $sortBy = $request->get('sort', '-created_at');
        $sortDirection = str_starts_with($sortBy, '-') ? 'desc' : 'asc';
        $sortBy = ltrim($sortBy, '-');

        if (in_array($sortBy, ['name', 'slug', 'created_at', 'updated_at', 'sort_order'])) {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Eager load relationships
        $query->with(['brand', 'categories', 'primaryImage']);

        // Pagination
        $perPage = min($request->get('size', 15), 100);
        $products = $query->paginate($perPage);

        return ProductResource::collection($products)->response();
    }

    /**
     * Store a newly created product with nested variants, categories, and images.
     *
     * @param ProductStoreRequest $request
     * @return JsonResponse
     */
    public function store(ProductStoreRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $data = $request->validated();

            // Generate slug if not provided
            if (empty($data['slug'])) {
                $data['slug'] = Str::slug($data['name']);
            }

            // Extract nested data
            $categories = $data['categories'] ?? [];
            $images = $data['images'] ?? [];
            $variants = $data['variants'] ?? [];

            // Create product
            $product = Product::create(Arr::except($data, ['categories', 'images', 'variants']));

            // Sync categories
            if (!empty($categories)) {
                $product->categories()->sync($categories);
            }

            // Create images
            if (!empty($images)) {
                foreach ($images as $image) {
                    $product->images()->create([
                        'url' => $image['url'],
                        'alt_text' => $image['alt_text'] ?? null,
                        'position' => $image['position'] ?? 0,
                        'is_primary' => $image['is_primary'] ?? false,
                    ]);
                }
            }

            // Create variants with attribute values
            if (!empty($variants)) {
                foreach ($variants as $variantData) {
                    $attributeValues = $variantData['attribute_values'] ?? [];
                    unset($variantData['attribute_values']);

                    $variant = ProductVariant::create(array_merge($variantData, [
                        'product_id' => $product->id,
                        'currency' => $variantData['currency'] ?? 'BDT',
                        'track_stock' => $variantData['track_stock'] ?? true,
                        'allow_backorder' => $variantData['allow_backorder'] ?? false,
                        'status' => $variantData['status'] ?? 'active',
                    ]));

                    // Create variant attribute values
                    foreach ($attributeValues as $av) {
                        VariantAttributeValue::create([
                            'variant_id' => $variant->id,
                            'attribute_id' => $av['attribute_id'],
                            'attribute_value_id' => $av['attribute_value_id'],
                        ]);
                    }
                }
            }

            // Load relationships for response
            $product->load(['brand', 'categories', 'images', 'variants.attributeValues.attribute', 'variants.attributeValues.attributeValue']);

            return (new ProductResource($product))
                ->response()
                ->setStatusCode(201);
        });
    }

    /**
     * Display the specified product.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $query = Product::query()->where('id', $id);

        // Eager load based on query params
        $query->with(['brand', 'categories']);

        if ($request->boolean('with_images')) {
            $query->with('images');
        }

        if ($request->boolean('with_variants')) {
            $query->with(['variants.attributeValues.attribute', 'variants.attributeValues.attributeValue']);
        }

        $product = $query->firstOrFail();

        return (new ProductResource($product))->response();
    }

    /**
     * Update the specified product (supports nested variant updates).
     *
     * @param ProductUpdateRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(ProductUpdateRequest $request, int $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $product = Product::findOrFail($id);
            $data = $request->validated();

            // Generate slug if name changed and slug not provided
            if (isset($data['name']) && !isset($data['slug'])) {
                // Generate unique slug if needed
                $baseSlug = Str::slug($data['name']);
                $slug = $baseSlug;
                $counter = 1;
                while (Product::where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }
                $data['slug'] = $slug;
            }

            // Extract nested data
            $categories = $data['categories'] ?? null;
            $variants = $data['variants'] ?? null;

            // Prepare product data (exclude nested relationships)
            $productData = Arr::only($data, array_intersect(array_keys($data), $product->getFillable()));
            unset($productData['categories'], $productData['variants']);

            // Update product
            if (!empty($productData)) {
                $product->update($productData);
            }

            // Sync categories if provided
            if ($categories !== null) {
                $product->categories()->sync($categories);
            }

            // Update variants if provided
            if ($variants !== null) {
                $existingVariantIds = collect($variants)->pluck('id')->filter()->toArray();
                $product->variants()->whereNotIn('id', $existingVariantIds)->delete();

                foreach ($variants as $variantData) {
                    $attributeValues = $variantData['attribute_values'] ?? [];
                    unset($variantData['attribute_values']);

                    if (isset($variantData['id'])) {
                        // Update existing variant
                        $variant = ProductVariant::findOrFail($variantData['id']);
                        $variant->update($variantData);

                        // Sync attribute values
                        $variant->attributeValues()->delete();
                        foreach ($attributeValues as $av) {
                            VariantAttributeValue::create([
                                'variant_id' => $variant->id,
                                'attribute_id' => $av['attribute_id'],
                                'attribute_value_id' => $av['attribute_value_id'],
                            ]);
                        }
                    } else {
                        // Create new variant
                        $variant = ProductVariant::create(array_merge($variantData, [
                            'product_id' => $product->id,
                            'currency' => $variantData['currency'] ?? 'BDT',
                            'track_stock' => $variantData['track_stock'] ?? true,
                            'allow_backorder' => $variantData['allow_backorder'] ?? false,
                            'status' => $variantData['status'] ?? 'active',
                        ]));

                        foreach ($attributeValues as $av) {
                            VariantAttributeValue::create([
                                'variant_id' => $variant->id,
                                'attribute_id' => $av['attribute_id'],
                                'attribute_value_id' => $av['attribute_value_id'],
                            ]);
                        }
                    }
                }
            }

            // Load relationships for response
            $product->load(['brand', 'categories', 'images', 'variants.attributeValues.attribute', 'variants.attributeValues.attributeValue']);

            return (new ProductResource($product))->response();
        });
    }

    /**
     * Remove the specified product.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully'], 200);
    }

    /**
     * Update pricing for product variants.
     *
     * @param ProductPricingUpdateRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function updatePricing(ProductPricingUpdateRequest $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        foreach ($request->variants as $variantData) {
            $variant = ProductVariant::where('id', $variantData['id'])
                ->where('product_id', $product->id)
                ->firstOrFail();

            $variant->update(Arr::only($variantData, ['price', 'compare_at_price', 'cost_price', 'currency']));
        }

        $product->load(['variants']);
        return (new ProductResource($product))->response();
    }

    /**
     * Update inventory settings for product variants.
     *
     * @param ProductInventoryUpdateRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateInventory(ProductInventoryUpdateRequest $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        foreach ($request->variants as $variantData) {
            $variant = ProductVariant::where('id', $variantData['id'])
                ->where('product_id', $product->id)
                ->firstOrFail();

            $variant->update(Arr::only($variantData, ['track_stock', 'allow_backorder']));
        }

        $product->load(['variants']);
        return (new ProductResource($product))->response();
    }

    /**
     * Sync product attribute values (for filtering).
     *
     * @param ProductAttributesSyncRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function syncAttributes(ProductAttributesSyncRequest $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->attributeValues()->sync($request->attribute_values);

        $product->load(['attributeValues']);
        return (new ProductResource($product))->response();
    }
}
