<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class ProductUpdateRequest extends ApiFormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     * Decode JSON string for variants if sent as string (FormData compatibility).
     * Convert string booleans ("1"/"0") to actual booleans for FormData compatibility.
     */
    protected function prepareForValidation(): void
    {
        // Decode variants if sent as JSON string
        if ($this->has('variants') && is_string($this->input('variants'))) {
            $decoded = json_decode($this->input('variants'), true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $this->merge(['variants' => $decoded]);
            }
        }

        // Convert string booleans to actual booleans for validation
        $booleanFields = ['is_active', 'is_featured', 'is_upcoming', 'call_for_price'];

        foreach ($booleanFields as $field) {
            if ($this->has($field)) {
                $value = $this->input($field);
                if ($value === '1' || $value === 'true' || $value === 1 || $value === true) {
                    $this->merge([$field => true]);
                } elseif ($value === '0' || $value === 'false' || $value === 0 || $value === false) {
                    $this->merge([$field => false]);
                }
            }
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $productId = $this->route('id') ?? $this->route('product');

        return [
            // Product fields
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($productId)],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'product_type' => ['sometimes', 'required', 'string', Rule::in(['simple', 'variant', 'bundle'])],
            'published_status' => ['nullable', 'string', Rule::in(['draft', 'published', 'archived'])],
            'visibility' => ['nullable', 'string', Rule::in(['catalog', 'search', 'hidden'])],
            'tax_class' => ['nullable', 'string', 'max:64'],
            'hs_code' => ['nullable', 'string', 'max:32'],
            'weight_grams' => ['nullable', 'integer', 'min:0'],
            'length_mm' => ['nullable', 'integer', 'min:0'],
            'width_mm' => ['nullable', 'integer', 'min:0'],
            'height_mm' => ['nullable', 'integer', 'min:0'],
            'is_featured' => ['nullable', 'boolean'],
            'is_upcoming' => ['nullable', 'boolean'],
            'call_for_price' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'seo_title' => ['nullable', 'string', 'max:191'],
            'seo_description' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer'],

            // Categories
            'categories' => ['nullable', 'array'],
            'categories.*' => ['integer', 'exists:categories,id'],

            // Images (replace set, up to 3 files)
            'images' => ['nullable', 'array', 'max:3'],
            'images.*' => ['file', 'image', 'mimes:jpeg,png,webp', 'max:5120'],

            // Variants (for nested editing)
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'variants.*.sku' => ['required', 'string', 'max:100'],
            'variants.*.barcode' => ['nullable', 'string', 'max:100'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.cost_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.currency' => ['nullable', 'string', 'size:3'],
            'variants.*.track_stock' => ['nullable', 'boolean'],
            'variants.*.allow_backorder' => ['nullable', 'boolean'],
            'variants.*.weight_grams' => ['nullable', 'integer', 'min:0'],
            'variants.*.length_mm' => ['nullable', 'integer', 'min:0'],
            'variants.*.width_mm' => ['nullable', 'integer', 'min:0'],
            'variants.*.height_mm' => ['nullable', 'integer', 'min:0'],
            'variants.*.status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
            'variants.*.attribute_values' => ['nullable', 'array'],
            'variants.*.attribute_values.*.attribute_id' => ['required_with:variants.*.attribute_values.*', 'integer', 'exists:attributes,id'],
            'variants.*.attribute_values.*.attribute_value_id' => ['required_with:variants.*.attribute_values.*', 'integer', 'exists:attribute_values,id'],

            // Inventory (optional, only for new variants)
            'variants.*.inventory' => ['nullable', 'array'],
            'variants.*.inventory.*.warehouse_id' => ['required_with:variants.*.inventory', 'integer', 'exists:warehouses,id'],
            'variants.*.inventory.*.on_hand' => ['required_with:variants.*.inventory.*.warehouse_id', 'integer', 'min:0'],
            'variants.*.inventory.*.safety_stock' => ['nullable', 'integer', 'min:0'],
            'variants.*.inventory.*.reorder_point' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $productId = $this->route('id') ?? $this->route('product');

            // Validate SKU uniqueness (ignore existing variants when updating)
            if ($this->has('variants')) {
                foreach ($this->variants as $variantIndex => $variant) {
                    if (isset($variant['sku'])) {
                        $variantId = $variant['id'] ?? null;
                        $query = \App\Models\Attribute\ProductVariant::where('sku', $variant['sku'])
                            ->where('product_id', $productId);

                        if ($variantId) {
                            $query->where('id', '!=', $variantId);
                        }

                        if ($query->exists()) {
                            $validator->errors()->add(
                                "variants.{$variantIndex}.sku",
                                'The SKU has already been taken for this product.'
                            );
                        }

                        // Validate barcode uniqueness
                        if (isset($variant['barcode'])) {
                            $barcodeQuery = \App\Models\Attribute\ProductVariant::where('barcode', $variant['barcode'])
                                ->where('product_id', $productId);

                            if ($variantId) {
                                $barcodeQuery->where('id', '!=', $variantId);
                            }

                            if ($barcodeQuery->exists()) {
                                $validator->errors()->add(
                                    "variants.{$variantIndex}.barcode",
                                    'The barcode has already been taken for this product.'
                                );
                            }
                        }
                    }

                    // Validate attribute values belong to attributes
                    if (isset($variant['attribute_values'])) {
                        foreach ($variant['attribute_values'] as $avIndex => $attributeValue) {
                            if (isset($attributeValue['attribute_id']) && isset($attributeValue['attribute_value_id'])) {
                                $attributeValueModel = \App\Models\Attribute\AttributeValue::find($attributeValue['attribute_value_id']);
                                if ($attributeValueModel && $attributeValueModel->attribute_id != $attributeValue['attribute_id']) {
                                    $validator->errors()->add(
                                        "variants.{$variantIndex}.attribute_values.{$avIndex}.attribute_value_id",
                                        'The attribute value does not belong to the specified attribute.'
                                    );
                                }
                            }
                        }

                        // Ensure each variant has only one value per attribute
                        $attributeIds = collect($variant['attribute_values'])
                            ->pluck('attribute_id')
                            ->toArray();
                        $duplicates = array_diff_assoc($attributeIds, array_unique($attributeIds));
                        if (!empty($duplicates)) {
                            $validator->errors()->add(
                                "variants.{$variantIndex}.attribute_values",
                                'Each variant can only have one value per attribute.'
                            );
                        }
                    }

                    // Validate inventory data (only for new variants without id)
                    if (!isset($variant['id']) && isset($variant['inventory']) && is_array($variant['inventory'])) {
                        $warehouseIds = [];
                        foreach ($variant['inventory'] as $invIndex => $inventory) {
                            // Check for duplicate warehouse_ids
                            if (isset($inventory['warehouse_id'])) {
                                if (in_array($inventory['warehouse_id'], $warehouseIds)) {
                                    $validator->errors()->add(
                                        "variants.{$variantIndex}.inventory.{$invIndex}.warehouse_id",
                                        'Duplicate warehouse_id. Each variant can only have one inventory entry per warehouse.'
                                    );
                                } else {
                                    $warehouseIds[] = $inventory['warehouse_id'];
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}
