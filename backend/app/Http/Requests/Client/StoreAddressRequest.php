<?php

namespace App\Http\Requests\Client;

use App\Http\Requests\ApiFormRequest;

class StoreAddressRequest extends ApiFormRequest
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
            'name' => ['required', 'string', 'max:191'],
            'contact_name' => ['nullable', 'string', 'max:191'],
            'phone' => ['nullable', 'string', 'max:50'],
            'line1' => ['required', 'string', 'max:191'],
            'line2' => ['nullable', 'string', 'max:191'],
            'city' => ['required', 'string', 'max:120'],
            'state_region' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:30'],
            'country_code' => ['required', 'string', 'size:2'],
            'is_default_billing' => ['nullable', 'boolean'],
            'is_default_shipping' => ['nullable', 'boolean'],
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
            'name.required' => 'Address name is required.',
            'name.max' => 'Address name cannot exceed 191 characters.',
            'line1.required' => 'Address line 1 is required.',
            'line1.max' => 'Address line 1 cannot exceed 191 characters.',
            'city.required' => 'City is required.',
            'city.max' => 'City cannot exceed 120 characters.',
            'country_code.required' => 'Country code is required.',
            'country_code.size' => 'Country code must be exactly 2 characters.',
        ];
    }
}

