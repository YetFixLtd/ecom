<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryStoreRequest;
use App\Http\Requests\Admin\CategoryUpdateRequest;
use App\Http\Resources\Admin\CategoryResource;
use App\Models\Catalog\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * List all categories with pagination and filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query();

        // Filter by parent
        if ($request->has('parent_id')) {
            $query->where('parent_id', $request->parent_id);
        } else {
            // By default, show root categories (no parent)
            if (!$request->has('include_all')) {
                $query->whereNull('parent_id');
            }
        }

        // Search by name
        if ($request->has('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        // Sorting
        $sortBy = $request->get('sort', 'position');
        $sortDirection = str_starts_with($sortBy, '-') ? 'desc' : 'asc';
        $sortBy = ltrim($sortBy, '-');

        if (in_array($sortBy, ['name', 'slug', 'position', 'created_at'])) {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Load relationships
        if ($request->boolean('with_children')) {
            $query->with('children');
        }

        if ($request->boolean('with_parent')) {
            $query->with('parent');
        }

        // Pagination
        $perPage = min($request->get('size', 15), 100);
        $categories = $query->paginate($perPage);

        return CategoryResource::collection($categories)->response();
    }

    /**
     * Store a newly created category.
     *
     * @param CategoryStoreRequest $request
     * @return JsonResponse
     */
    public function store(CategoryStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category = Category::create($data);

        return (new CategoryResource($category))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified category.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $query = Category::query()->where('id', $id);

        if ($request->boolean('with_children')) {
            $query->with('children');
        }

        if ($request->boolean('with_parent')) {
            $query->with('parent');
        }

        $category = $query->withCount('products')->firstOrFail();

        return (new CategoryResource($category))->response();
    }

    /**
     * Update the specified category.
     *
     * @param CategoryUpdateRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(CategoryUpdateRequest $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $data = $request->validated();

        // Generate slug if name changed and slug not provided
        if (isset($data['name']) && !isset($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category->update($data);

        return (new CategoryResource($category->fresh()))->response();
    }

    /**
     * Remove the specified category.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        // Prevent deletion if category has children
        if ($category->hasChildren()) {
            return response()->json([
                'message' => 'Cannot delete category with child categories. Please delete or reassign child categories first.',
            ], 409);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully'], 200);
    }
}
