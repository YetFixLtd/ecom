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
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    use ProductImageStorage;
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
        $query->with(['brand', 'categories', 'images']);

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

            // Create images (inline upload up to 3 files)
            if (!empty($images)) {
                $position = 0;
                foreach ($request->file('images', []) as $file) {
                    if ($position >= 3) {
                        break;
                    }

                    $stored = $this->storeProductImageFiles($product->id, $file);

                    if ($stored) {
                        $product->images()->create([
                            // keep legacy url populated to satisfy NOT NULL schema
                            'url' => $stored['original'],
                            'path_original' => $stored['original'],
                            'path_medium' => $stored['medium'],
                            'path_thumb' => $stored['thumb'],
                            'alt_text' => null,
                            'position' => $position,
                            'is_primary' => $position === 0,
                        ]);
                        $position++;
                    }
                }
            }

            // Create variants with attribute values
            if (!empty($variants)) {
                foreach ($variants as $variantData) {
                    $attributeValues = $variantData['attribute_values'] ?? [];
                    $inventoryData = $variantData['inventory'] ?? [];
                    unset($variantData['attribute_values'], $variantData['inventory']);

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

                    // Create inventory items if provided and track_stock is true
                    if (!empty($inventoryData) && $variant->track_stock) {
                        foreach ($inventoryData as $inv) {
                            $inventoryItem = \App\Models\Inventory\InventoryItem::create([
                                'variant_id' => $variant->id,
                                'warehouse_id' => $inv['warehouse_id'],
                                'on_hand' => $inv['on_hand'] ?? 0,
                                'reserved' => 0,
                                'safety_stock' => $inv['safety_stock'] ?? 0,
                                'reorder_point' => $inv['reorder_point'] ?? 0,
                            ]);

                            // Create movement record for audit trail
                            \App\Models\Inventory\InventoryMovement::create([
                                'variant_id' => $variant->id,
                                'warehouse_id' => $inv['warehouse_id'],
                                'qty_change' => $inv['on_hand'] ?? 0,
                                'movement_type' => 'adjustment',
                                'reference_type' => 'product_creation',
                                'reference_id' => $product->id,
                                'performed_by' => $request->user('admin_sanctum')?->id,
                                'performed_at' => now(),
                            ]);
                        }
                    }
                    // If no inventory data was provided but the variant tracks stock,
                    // ensure at least one InventoryItem row exists (with zero on_hand)
                    // so the SKU is available for future stock adjustments.
                    elseif (empty($inventoryData) && $variant->track_stock) {
                        // Use the default warehouse if configured; otherwise fall back
                        // to the first available warehouse.
                        $defaultWarehouse = \App\Models\Inventory\Warehouse::where('is_default', true)->first()
                            ?? \App\Models\Inventory\Warehouse::first();

                        if ($defaultWarehouse) {
                            \App\Models\Inventory\InventoryItem::create([
                                'variant_id' => $variant->id,
                                'warehouse_id' => $defaultWarehouse->id,
                                'on_hand' => 0,
                                'reserved' => 0,
                                'safety_stock' => 0,
                                'reorder_point' => 0,
                            ]);
                        }
                    }
                }
            }

            // Load relationships for response
            $loadRelations = ['brand', 'categories', 'images', 'variants.attributeValues.attribute', 'variants.attributeValues.attributeValue'];
            if ($request->boolean('with_inventory')) {
                $loadRelations[] = 'variants.inventoryItems.warehouse';
            }
            $product->load($loadRelations);

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

        // Always eager-load images for detail view
        $query->with(['brand', 'categories', 'images']);

        if ($request->boolean('with_variants')) {
            $loadVariants = ['variants.attributeValues.attribute', 'variants.attributeValues.attributeValue'];

            // If requesting inventory, also load inventory items
            if ($request->boolean('with_inventory')) {
                $loadVariants[] = 'variants.inventoryItems.warehouse';
            }

            $query->with($loadVariants);
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
            // Get all input to ensure we capture fields that might be filtered by validation
            // This is important because 'sometimes' rules only validate present fields
            $allInput = $request->all();

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
            $categories = $data['categories'] ?? ($allInput['categories'] ?? null);
            $variants = $data['variants'] ?? null;

            // Prepare product data - get all fillable fields from input
            // Include fields from validated data first, then merge with any other input fields
            $fillableFields = $product->getFillable();
            $productData = [];

            foreach ($fillableFields as $field) {
                // Skip nested relationships
                if (in_array($field, ['categories', 'variants'])) {
                    continue;
                }

                // Priority: Use validated data if available, otherwise check all input
                // Use $request->input() to get the actual value, including empty strings
                if (array_key_exists($field, $data)) {
                    // Field passed validation, use validated value
                    $productData[$field] = $data[$field];
                } elseif ($request->has($field)) {
                    // Field exists in request but might not have passed validation
                    // This can happen with 'sometimes' rules - include it anyway for updates
                    $productData[$field] = $request->input($field);
                }
            }

            // Handle empty strings for nullable fields - convert to null if they're empty strings
            // Also handle boolean fields that come as strings from FormData
            foreach ($productData as $key => $value) {
                if ($value === '') {
                    // Convert empty strings to null for nullable fields
                    // But keep empty strings for required fields like 'name'
                    if (in_array($key, ['slug', 'description', 'short_description', 'brand_id'])) {
                        $productData[$key] = null;
                    }
                }

                // Convert string booleans to actual booleans
                if (in_array($key, ['is_active', 'is_featured'])) {
                    if ($value === '0' || $value === 'false' || $value === false) {
                        $productData[$key] = false;
                    } elseif ($value === '1' || $value === 'true' || $value === true) {
                        $productData[$key] = true;
                    }
                }
            }

            // Update product if we have data to update
            if (!empty($productData)) {
                $product->update($productData);
                // Refresh the model to get the latest data
                $product->refresh();
            }

            // Sync categories if provided
            if ($categories !== null) {
                $product->categories()->sync($categories);
            }

            // Replace images if new files provided
            if ($request->hasFile('images')) {
                // delete existing files and records
                foreach ($product->images as $img) {
                    $this->deleteProductImageFiles($img);
                }
                $product->images()->delete();

                $position = 0;
                foreach ($request->file('images', []) as $file) {
                    if ($position >= 3) {
                        break;
                    }
                    $stored = $this->storeProductImageFiles($product->id, $file);
                    if ($stored) {
                        $product->images()->create([
                            'url' => $stored['original'],
                            'path_original' => $stored['original'],
                            'path_medium' => $stored['medium'],
                            'path_thumb' => $stored['thumb'],
                            'alt_text' => null,
                            'position' => $position,
                            'is_primary' => $position === 0,
                        ]);
                        $position++;
                    }
                }
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
                        $inventoryData = $variantData['inventory'] ?? [];
                        unset($variantData['inventory']);

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

                        // Create inventory items if provided and track_stock is true
                        if (!empty($inventoryData) && $variant->track_stock) {
                            foreach ($inventoryData as $inv) {
                                $inventoryItem = \App\Models\Inventory\InventoryItem::create([
                                    'variant_id' => $variant->id,
                                    'warehouse_id' => $inv['warehouse_id'],
                                    'on_hand' => $inv['on_hand'] ?? 0,
                                    'reserved' => 0,
                                    'safety_stock' => $inv['safety_stock'] ?? 0,
                                    'reorder_point' => $inv['reorder_point'] ?? 0,
                                ]);

                                // Create movement record for audit trail
                                \App\Models\Inventory\InventoryMovement::create([
                                    'variant_id' => $variant->id,
                                    'warehouse_id' => $inv['warehouse_id'],
                                    'qty_change' => $inv['on_hand'] ?? 0,
                                    'movement_type' => 'adjustment',
                                    'reference_type' => 'product_creation',
                                    'reference_id' => $product->id,
                                    'performed_by' => $request->user('admin_sanctum')?->id,
                                    'performed_at' => now(),
                                ]);
                            }
                        }
                    }
                }
            }

            // Load relationships for response
            $loadRelations = ['brand', 'categories', 'images', 'variants.attributeValues.attribute', 'variants.attributeValues.attributeValue'];
            if ($request->boolean('with_inventory')) {
                $loadRelations[] = 'variants.inventoryItems.warehouse';
            }
            $product->load($loadRelations);

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

/**
 * Image storage helpers (GD-based resizing)
 */
trait ProductImageStorage
{
    protected function storeProductImageFiles(int $productId, \Illuminate\Http\UploadedFile $file): ?array
    {
        $disk = 'public';
        $baseDir = "products/{$productId}";

        // Ensure directories
        Storage::disk($disk)->makeDirectory("{$baseDir}/original");
        Storage::disk($disk)->makeDirectory("{$baseDir}/medium");
        Storage::disk($disk)->makeDirectory("{$baseDir}/thumb");

        // Generate safe filename
        $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = uniqid('img_', true) . '.' . $extension;

        // Save original
        $originalPath = Storage::disk($disk)->putFileAs("{$baseDir}/original", $file, $filename);

        try {
            // Read original binary for resizing
            $binary = Storage::disk($disk)->get($originalPath);

            $mediumPath = "{$baseDir}/medium/{$filename}";
            $thumbPath = "{$baseDir}/thumb/{$filename}";

            $this->resizeAndSave($binary, 800, $disk, $mediumPath);
            $this->resizeAndSave($binary, 200, $disk, $thumbPath);

            return [
                'original' => '/storage/' . $originalPath,
                'medium' => '/storage/' . $mediumPath,
                'thumb' => '/storage/' . $thumbPath,
            ];
        } catch (\Throwable $e) {
            // Cleanup on failure
            if (isset($originalPath)) {
                Storage::disk($disk)->delete($originalPath);
            }
            return null;
        }
    }

    protected function resizeAndSave(string $binary, int $targetMax, string $disk, string $path): void
    {
        $source = \imagecreatefromstring($binary);
        if ($source === false) {
            throw new \RuntimeException('Invalid image data');
        }

        $width = \imagesx($source);
        $height = \imagesy($source);

        // Calculate new size preserving aspect ratio, scale so longest side == targetMax
        if ($width >= $height) {
            $newWidth = $targetMax;
            $newHeight = (int) floor($height * ($targetMax / $width));
        } else {
            $newHeight = $targetMax;
            $newWidth = (int) floor($width * ($targetMax / $height));
        }

        $dest = \imagecreatetruecolor($newWidth, $newHeight);
        \imagealphablending($dest, false);
        \imagesavealpha($dest, true);

        // Preserve transparency for PNG/WebP
        $transparent = \imagecolorallocatealpha($dest, 0, 0, 0, 127);
        \imagefilledrectangle($dest, 0, 0, $newWidth, $newHeight, $transparent);

        \imagecopyresampled($dest, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        // Determine encoder by file extension
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        ob_start();
        if ($ext === 'png') {
            \imagepng($dest, null, 6);
        } elseif ($ext === 'webp') {
            \imagewebp($dest, null, 85);
        } else {
            \imagejpeg($dest, null, 85);
        }
        $resizedData = ob_get_clean();

        \imagedestroy($source);
        \imagedestroy($dest);

        Storage::disk($disk)->put($path, $resizedData);
    }

    protected function deleteProductImageFiles(\App\Models\Catalog\ProductImage $image): void
    {
        $disk = 'public';
        foreach (['path_original', 'path_medium', 'path_thumb'] as $key) {
            $path = $image->{$key};
            if ($path) {
                $relative = ltrim(str_replace('/storage/', '', $path), '/');
                Storage::disk($disk)->delete($relative);
            }
        }
    }
}
