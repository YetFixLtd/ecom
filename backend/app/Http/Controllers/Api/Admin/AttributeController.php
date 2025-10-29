<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AttributeStoreRequest;
use App\Http\Requests\Admin\AttributeUpdateRequest;
use App\Http\Resources\Admin\AttributeResource;
use App\Models\Attribute\Attribute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AttributeController extends Controller
{
    /**
     * List all attributes with pagination and filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Attribute::query();

        // Search by name
        if ($request->has('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        // Sorting
        $sortBy = $request->get('sort', 'position');
        $sortDirection = str_starts_with($sortBy, '-') ? 'desc' : 'asc';
        $sortBy = ltrim($sortBy, '-');

        if (in_array($sortBy, ['name', 'slug', 'position'])) {
            $query->orderBy($sortBy, $sortDirection);
        }

        // Load values
        if ($request->boolean('with_values')) {
            $query->with('values');
        }

        // Pagination
        $perPage = min($request->get('size', 15), 100);
        $attributes = $query->paginate($perPage);

        return AttributeResource::collection($attributes)->response();
    }

    /**
     * Store a newly created attribute.
     *
     * @param AttributeStoreRequest $request
     * @return JsonResponse
     */
    public function store(AttributeStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $attribute = Attribute::create($data);
        $attribute->load('values');

        return (new AttributeResource($attribute))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified attribute.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $query = Attribute::query()->where('id', $id);

        if ($request->boolean('with_values')) {
            $query->with('values');
        }

        $attribute = $query->withCount('values')->firstOrFail();

        return (new AttributeResource($attribute))->response();
    }

    /**
     * Update the specified attribute.
     *
     * @param AttributeUpdateRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(AttributeUpdateRequest $request, int $id): JsonResponse
    {
        $attribute = Attribute::findOrFail($id);
        $data = $request->validated();

        // Generate slug if name changed and slug not provided
        if (isset($data['name']) && !isset($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $attribute->update($data);
        $attribute->load('values');

        return (new AttributeResource($attribute->fresh()))->response();
    }

    /**
     * Remove the specified attribute.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $attribute = Attribute::findOrFail($id);

        // Check if attribute has values
        if ($attribute->values()->exists()) {
            return response()->json([
                'message' => 'Cannot delete attribute with values. Please delete or reassign attribute values first.',
            ], 409);
        }

        $attribute->delete();

        return response()->json(['message' => 'Attribute deleted successfully'], 200);
    }
}
