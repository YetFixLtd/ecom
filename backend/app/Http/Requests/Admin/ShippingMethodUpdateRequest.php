<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class ShippingMethodUpdateRequest extends ApiFormRequest
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
        $methodId = $this->route('shipping_method') ?? $this->route('id');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:191'],
            'code' => ['sometimes', 'required', 'string', 'max:64', Rule::unique('shipping_methods', 'code')->ignore($methodId)],
            'carrier' => ['nullable', 'string', 'max:64'],
            'description' => ['nullable', 'string'],
            'calculation_type' => ['sometimes', 'required', 'string', 'in:flat,weight,price,weight_and_price'],
            'base_rate' => ['sometimes', 'required', 'numeric', 'min:0'],
            'per_kg_rate' => ['nullable', 'numeric', 'min:0'],
            'per_item_rate' => ['nullable', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'max_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'estimated_days' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'config' => ['nullable', 'array'],
        ];
    }
}
