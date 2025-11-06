<?php

namespace App\Http\Controllers\Api\Client;

use App\Http\Controllers\Controller;
use App\Http\Resources\Client\CategoryResource;
use App\Models\Catalog\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Category Controller
 *
 * Handles category listing for clients.
 */
class CategoryController extends Controller
{
    /**
     * List all categories in tree structure.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query();

        // Load parent and children for tree structure
        $query->with(['parent', 'children']);

        // If flat structure is requested, don't load relationships
        if ($request->boolean('flat')) {
            $categories = $query->orderBy('position')->get();
        } else {
            // Get root categories (no parent) and their children
            $categories = $query->whereNull('parent_id')
                ->orderBy('position')
                ->with(['children' => function ($q) {
                    $q->orderBy('position');
                }])
                ->get();
        }

        return response()->json([
            'data' => CategoryResource::collection($categories),
        ]);
    }

    /**
     * Show a specific category.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $category = Category::with(['parent', 'children'])
            ->findOrFail($id);

        // Count published products in this category
        $category->loadCount([
            'products' => function ($q) {
                $q->where('published_status', 'published')
                    ->where('is_active', true);
            },
        ]);

        return response()->json([
            'data' => new CategoryResource($category),
        ]);
    }
}
