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

        // Only show active categories to clients
        $query->where('status', 'active');

        // Filter by featured if requested
        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        // If flat structure is requested, don't load relationships
        if ($request->boolean('flat')) {
            $categories = $query->orderBy('position')->get();
        } else {
            // Get root categories (no parent) and recursively load all children
            // Using dot notation to load nested children up to 10 levels deep
            // Only load active children at each level
            $categories = $query->whereNull('parent_id')
                ->orderBy('position')
                ->with([
                    'children' => function ($q) {
                        $q->where('status', 'active')->orderBy('position');
                    },
                    'children.children' => function ($q) {
                        $q->where('status', 'active')->orderBy('position');
                    },
                    'children.children.children' => function ($q) {
                        $q->where('status', 'active')->orderBy('position');
                    },
                    'children.children.children.children' => function ($q) {
                        $q->where('status', 'active')->orderBy('position');
                    },
                    'children.children.children.children.children' => function ($q) {
                        $q->where('status', 'active')->orderBy('position');
                    },
                    'children.children.children.children.children.children' => function ($q) {
                        $q->where('status', 'active')->orderBy('position');
                    },
                    'children.children.children.children.children.children.children' => function ($q) {
                        $q->where('status', 'active')->orderBy('position');
                    },
                    'children.children.children.children.children.children.children.children' => function ($q) {
                        $q->where('status', 'active')->orderBy('position');
                    },
                    'children.children.children.children.children.children.children.children.children' => function ($q) {
                        $q->where('status', 'active')->orderBy('position');
                    },
                    'children.children.children.children.children.children.children.children.children.children' => function ($q) {
                        $q->where('status', 'active')->orderBy('position');
                    },
                ])
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
        // Recursively load parent chain and all children
        $category = Category::with([
            'parent',
            'parent.parent',
            'parent.parent.parent',
            'parent.parent.parent.parent',
            'parent.parent.parent.parent.parent',
            'children' => function ($q) {
                $q->orderBy('position');
            },
            'children.children' => function ($q) {
                $q->orderBy('position');
            },
            'children.children.children' => function ($q) {
                $q->orderBy('position');
            },
            'children.children.children.children' => function ($q) {
                $q->orderBy('position');
            },
            'children.children.children.children.children' => function ($q) {
                $q->orderBy('position');
            },
            'children.children.children.children.children.children' => function ($q) {
                $q->orderBy('position');
            },
            'children.children.children.children.children.children.children' => function ($q) {
                $q->orderBy('position');
            },
            'children.children.children.children.children.children.children.children' => function ($q) {
                $q->orderBy('position');
            },
            'children.children.children.children.children.children.children.children.children' => function ($q) {
                $q->orderBy('position');
            },
            'children.children.children.children.children.children.children.children.children.children' => function ($q) {
                $q->orderBy('position');
            },
        ])
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
