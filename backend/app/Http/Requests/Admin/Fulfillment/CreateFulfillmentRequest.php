<?php

namespace App\Http\Requests\Admin\Fulfillment;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class CreateFulfillmentRequest extends ApiFormRequest
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'integer', 'exists:order_items,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'carrier' => ['nullable', 'string', 'max:64'],
        ];
    }
}

