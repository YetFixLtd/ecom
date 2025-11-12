<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class ProductStoreRequest extends ApiFormRequest
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
     */
    protected function prepareForValidation(): void
    {
        // Decode variants if sent as JSON string
        $variants = null;
        if ($this->has('variants')) {
            if (is_string($this->input('variants'))) {
                $decoded = json_decode($this->input('variants'), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $variants = $decoded;
                }
            } elseif (is_array($this->input('variants'))) {
                $variants = $this->input('variants');
            }
        }

        // Ensure attribute_values is set for simple products (can be empty array)
        $productType = $this->input('product_type');
        if ($variants !== null && is_array($variants)) {
            $modified = false;
            foreach ($variants as $index => $variant) {
                // For simple products, always ensure attribute_values is set to an array
                // This handles cases where it might be missing or null after JSON decoding
                if ($productType === 'simple') {
                    if (
                        !isset($variant['attribute_values']) ||
                        $variant['attribute_values'] === null ||
                        !is_array($variant['attribute_values'])
                    ) {
                        $variants[$index]['attribute_values'] = [];
                        $modified = true;
                    }
                }
            }
            if ($modified || $variants !== $this->input('variants')) {
                // Use replace to ensure the variants are properly set
                $allInput = $this->all();
                $allInput['variants'] = $variants;
                $this->replace($allInput);
            }
        }

        // Convert string booleans to actual booleans for validation
        $booleanFields = ['is_active', 'is_featured'];
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
        return [
            // Product fields
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'product_type' => ['required', 'string', Rule::in(['simple', 'variant', 'bundle'])],
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

            // Images (inline upload, up to 3 files)
            'images' => ['nullable', 'array', 'max:3'],
            'images.*' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:5120',
            ],

            // Variants (required for variant/bundle types)
            'variants' => ['required_if:product_type,variant', 'array'],
            'variants.*.sku' => ['required', 'string', 'max:100', 'unique:product_variants,sku'],
            'variants.*.barcode' => ['nullable', 'string', 'max:100', 'unique:product_variants,barcode'],
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
            'variants.*.attribute_values' => [
                'nullable',
                'array',
                // Attribute values are optional - variants can exist without attributes
            ],
            'variants.*.attribute_values.*.attribute_id' => ['required_with:variants.*.attribute_values.*', 'integer', 'exists:attributes,id'],
            'variants.*.attribute_values.*.attribute_value_id' => ['required_with:variants.*.attribute_values.*', 'integer', 'exists:attribute_values,id'],

            // Inventory (optional)
            'variants.*.inventory' => ['nullable', 'array'],
            'variants.*.inventory.*.warehouse_id' => ['required_with:variants.*.inventory', 'integer', 'exists:warehouses,id'],
            'variants.*.inventory.*.on_hand' => ['required_with:variants.*.inventory.*.warehouse_id', 'integer', 'min:0'],
            'variants.*.inventory.*.safety_stock' => ['nullable', 'integer', 'min:0'],
            'variants.*.inventory.*.reorder_point' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'images.*.file' => 'The uploaded file must be a valid file.',
            'images.*.image' => 'The uploaded file must be an image (jpeg, png, webp).',
            'images.*.mimes' => 'The image must be a file of type: jpeg, png, webp.',
            'images.*.max' => 'The image may not be greater than 5MB (5120KB).',
            'images.0' => 'The first image failed to upload. Please check file size (max 5MB) and format (JPEG, PNG, WebP).',
            'images.1' => 'The second image failed to upload. Please check file size (max 5MB) and format (JPEG, PNG, WebP).',
            'images.2' => 'The third image failed to upload. Please check file size (max 5MB) and format (JPEG, PNG, WebP).',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Add detailed error messages for image upload failures
            if ($this->hasFile('images')) {
                foreach ($this->file('images', []) as $index => $file) {
                    if ($file && $file->isValid()) {
                        // File is valid, check specific validations
                        $maxSize = 5120; // 5MB in KB
                        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
                        $fileSizeKB = $file->getSize() / 1024;
                        $fileMime = $file->getMimeType();

                        if ($fileSizeKB > $maxSize) {
                            $validator->errors()->add(
                                "images.{$index}",
                                "Image {$index}: File size ({$fileSizeKB}KB) exceeds the 5MB limit."
                            );
                        }

                        if (!in_array($fileMime, $allowedMimes)) {
                            $validator->errors()->add(
                                "images.{$index}",
                                "Image {$index}: Invalid file type ({$fileMime}). Only JPEG, PNG, and WebP are allowed."
                            );
                        }
                    } elseif ($file && !$file->isValid()) {
                        // File upload failed
                        $errorCode = $file->getError();
                        $errorMessages = [
                            UPLOAD_ERR_INI_SIZE => "Image {$index}: File exceeds upload_max_filesize directive in php.ini.",
                            UPLOAD_ERR_FORM_SIZE => "Image {$index}: File exceeds MAX_FILE_SIZE directive in HTML form.",
                            UPLOAD_ERR_PARTIAL => "Image {$index}: File was only partially uploaded.",
                            UPLOAD_ERR_NO_FILE => "Image {$index}: No file was uploaded.",
                            UPLOAD_ERR_NO_TMP_DIR => "Image {$index}: Missing temporary folder.",
                            UPLOAD_ERR_CANT_WRITE => "Image {$index}: Failed to write file to disk.",
                            UPLOAD_ERR_EXTENSION => "Image {$index}: A PHP extension stopped the file upload.",
                        ];

                        $errorMessage = $errorMessages[$errorCode] ?? "Image {$index}: Upload failed with error code {$errorCode}.";
                        $validator->errors()->add("images.{$index}", $errorMessage);
                    }
                }
            }
            // Validate that attribute values belong to their attributes
            if ($this->has('variants')) {
                foreach ($this->variants as $variantIndex => $variant) {
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
                                    break;
                                }
                            }
                        }
                    }

                    // Validate inventory data
                    if (isset($variant['inventory']) && is_array($variant['inventory'])) {
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
