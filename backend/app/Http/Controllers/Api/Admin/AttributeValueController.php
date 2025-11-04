<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AttributeValueStoreRequest;
use App\Http\Requests\Admin\AttributeValueUpdateRequest;
use App\Http\Resources\Admin\AttributeValueResource;
use App\Models\Attribute\Attribute;
use App\Models\Attribute\AttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttributeValueController extends Controller
{
    /**
     * List all values for a specific attribute.
     *
     * @param Request $request
     * @param int $attribute
     * @return JsonResponse
     */
    public function index(Request $request, int $attribute): JsonResponse
    {
        // Verify attribute exists
        $attributeModel = Attribute::findOrFail($attribute);

        $query = AttributeValue::where('attribute_id', $attribute);

        // Search by value
        if ($request->has('q')) {
            $query->where('value', 'like', '%' . $request->q . '%');
        }

        // Sorting
        $sortBy = $request->get('sort', 'position');
        $sortDirection = str_starts_with($sortBy, '-') ? 'desc' : 'asc';
        $sortBy = ltrim($sortBy, '-');

        if (in_array($sortBy, ['value', 'position'])) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('position');
        }

        // Pagination
        $perPage = min($request->get('size', 50), 100);
        $values = $query->paginate($perPage);

        return AttributeValueResource::collection($values)->response();
    }

    /**
     * Store a newly created attribute value.
     *
     * @param AttributeValueStoreRequest $request
     * @param int $attribute
     * @return JsonResponse
     */
    public function store(AttributeValueStoreRequest $request, int $attribute): JsonResponse
    {
        // Verify attribute exists
        $attributeModel = Attribute::findOrFail($attribute);

        $data = $request->validated();
        $data['attribute_id'] = $attribute;

        // Set default position if not provided
        if (!isset($data['position'])) {
            $maxPosition = AttributeValue::where('attribute_id', $attribute)->max('position') ?? 0;
            $data['position'] = $maxPosition + 1;
        }

        $attributeValue = AttributeValue::create($data);

        return (new AttributeValueResource($attributeValue))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified attribute value.
     *
     * @param int $attribute
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $attribute, int $id): JsonResponse
    {
        // Verify attribute exists
        Attribute::findOrFail($attribute);

        $attributeValue = AttributeValue::where('attribute_id', $attribute)
            ->findOrFail($id);

        return (new AttributeValueResource($attributeValue))->response();
    }

    /**
     * Update the specified attribute value.
     *
     * @param AttributeValueUpdateRequest $request
     * @param int $attribute
     * @param int $id
     * @return JsonResponse
     */
    public function update(AttributeValueUpdateRequest $request, int $attribute, int $id): JsonResponse
    {
        // Verify attribute exists
        Attribute::findOrFail($attribute);

        $attributeValue = AttributeValue::where('attribute_id', $attribute)
            ->findOrFail($id);

        $data = $request->validated();
        $attributeValue->update($data);

        return (new AttributeValueResource($attributeValue->fresh()))->response();
    }

    /**
     * Remove the specified attribute value.
     *
     * @param int $attribute
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $attribute, int $id): JsonResponse
    {
        // Verify attribute exists
        Attribute::findOrFail($attribute);

        $attributeValue = AttributeValue::where('attribute_id', $attribute)
            ->findOrFail($id);

        // Check if value is used in any variants
        if ($attributeValue->variantAttributeValues()->exists()) {
            return response()->json([
                'message' => 'Cannot delete attribute value that is used in product variants. Please remove it from variants first.',
            ], 409);
        }

        $attributeValue->delete();

        return response()->json(['message' => 'Attribute value deleted successfully'], 200);
    }

    /**
     * Reorder attribute values.
     *
     * @param Request $request
     * @param int $attribute
     * @return JsonResponse
     */
    public function reorder(Request $request, int $attribute): JsonResponse
    {
        // Verify attribute exists
        Attribute::findOrFail($attribute);

        $request->validate([
            'values' => ['required', 'array'],
            'values.*.id' => ['required', 'integer', 'exists:attribute_values,id'],
            'values.*.position' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($request->values as $item) {
            AttributeValue::where('attribute_id', $attribute)
                ->where('id', $item['id'])
                ->update(['position' => $item['position']]);
        }

        return response()->json(['message' => 'Attribute values reordered successfully'], 200);
    }
}

