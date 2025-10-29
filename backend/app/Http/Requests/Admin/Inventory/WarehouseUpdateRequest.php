<?php

namespace App\Http\Requests\Admin\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WarehouseUpdateRequest extends FormRequest
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
        $warehouseId = $this->route('id') ?? $this->route('warehouse');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:191'],
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('warehouses', 'code')->ignore($warehouseId)],
            'address1' => ['nullable', 'string', 'max:255'],
            'address2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state_region' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:30'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
