<?php

namespace App\Http\Requests\Admin\Inventory;

use App\Http\Requests\ApiFormRequest;

class TransferUpdateRequest extends ApiFormRequest
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
            'from_warehouse_id' => ['sometimes', 'required', 'integer', 'exists:warehouses,id'],
            'to_warehouse_id' => ['sometimes', 'required', 'integer', 'exists:warehouses,id', 'different:from_warehouse_id'],
            'items' => ['sometimes', 'required', 'array', 'min:1'],
            'items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
        ];
    }
}
