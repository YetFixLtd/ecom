<?php

namespace App\Http\Requests\Admin\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class ReservationRequest extends FormRequest
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
            'qty' => ['required', 'integer', 'min:1'],
            'reference_type' => ['nullable', 'string', 'max:64'],
            'reference_id' => ['nullable', 'integer'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
