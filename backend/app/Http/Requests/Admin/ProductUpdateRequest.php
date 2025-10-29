<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
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
            'is_active' => ['nullable', 'boolean'],
            'seo_title' => ['nullable', 'string', 'max:191'],
            'seo_description' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer'],

            // Categories
            'categories' => ['nullable', 'array'],
            'categories.*' => ['integer', 'exists:categories,id'],

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
            'variants.*.attribute_values' => ['required', 'array', 'min:1'],
            'variants.*.attribute_values.*.attribute_id' => ['required', 'integer', 'exists:attributes,id'],
            'variants.*.attribute_values.*.attribute_value_id' => ['required', 'integer', 'exists:attribute_values,id'],
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
                }
            }
        });
    }
}

