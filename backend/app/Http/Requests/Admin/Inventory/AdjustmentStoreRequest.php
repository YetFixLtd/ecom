<?php

namespace App\Http\Requests\Admin\Inventory;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class AdjustmentStoreRequest extends ApiFormRequest
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
            'variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'adjustment_mode' => ['required', 'string', Rule::in(['SET_ON_HAND', 'DELTA_ON_HAND'])],
            'qty' => ['required', 'integer'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'reason_code' => ['nullable', 'string', 'max:64'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
