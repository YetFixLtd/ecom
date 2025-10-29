<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ProductInventoryUpdateRequest extends FormRequest
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
        return [
            'variants' => ['required', 'array'],
            'variants.*.id' => ['required', 'integer', 'exists:product_variants,id'],
            'variants.*.track_stock' => ['nullable', 'boolean'],
            'variants.*.allow_backorder' => ['nullable', 'boolean'],
        ];
    }
}
