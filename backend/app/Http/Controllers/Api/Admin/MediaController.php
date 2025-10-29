<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductImageStoreRequest;
use App\Http\Resources\Admin\ProductImageResource;
use App\Models\Catalog\Product;
use App\Models\Catalog\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    /**
     * Store a new image for a product.
     *
     * @param ProductImageStoreRequest $request
     * @param int $productId
     * @return JsonResponse
     */
    public function storeImage(ProductImageStoreRequest $request, int $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);

        $data = $request->validated();

        // If this is marked as primary, unset other primary images
        if ($data['is_primary'] ?? false) {
            $product->images()->update(['is_primary' => false]);
        }

        $image = $product->images()->create([
            'url' => $data['url'],
            'alt_text' => $data['alt_text'] ?? null,
            'position' => $data['position'] ?? ($product->images()->max('position') + 1 ?? 0),
            'is_primary' => $data['is_primary'] ?? false,
        ]);

        return (new ProductImageResource($image))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Delete a product image.
     *
     * @param int $productId
     * @param int $imageId
     * @return JsonResponse
     */
    public function destroyImage(int $productId, int $imageId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $image = ProductImage::where('id', $imageId)
            ->where('product_id', $product->id)
            ->firstOrFail();

        $image->delete();

        return response()->json(['message' => 'Image deleted successfully'], 200);
    }

    /**
     * List all images for a product.
     *
     * @param int $productId
     * @return JsonResponse
     */
    public function indexImages(int $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $images = $product->images()->orderBy('position')->get();

        return ProductImageResource::collection($images)->response();
    }
}
