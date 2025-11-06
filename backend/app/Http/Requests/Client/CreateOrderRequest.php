<?php

namespace App\Http\Requests\Client;

use App\Http\Requests\ApiFormRequest;

class CreateOrderRequest extends ApiFormRequest
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
            'billing_address_id' => ['required', 'integer', 'exists:addresses,id'],
            'shipping_address_id' => ['required', 'integer', 'exists:addresses,id'],
            'shipping_method_id' => ['nullable', 'integer', 'exists:shipping_methods,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'billing_address_id.required' => 'Billing address is required.',
            'billing_address_id.exists' => 'The selected billing address does not exist.',
            'shipping_address_id.required' => 'Shipping address is required.',
            'shipping_address_id.exists' => 'The selected shipping address does not exist.',
            'shipping_method_id.exists' => 'The selected shipping method does not exist.',
        ];
    }
}
