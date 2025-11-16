<?php

namespace App\Http\Requests\Client;

use App\Http\Requests\ApiFormRequest;
use Laravel\Sanctum\PersonalAccessToken;

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
     * Prepare the data for validation.
     * Manually authenticate user from token if route is outside middleware.
     */
    protected function prepareForValidation(): void
    {
        // Try to get user from request (works if middleware processed it)
        $user = $this->user();

        // If no user from request, try to authenticate manually from token
        if (!$user && $this->bearerToken()) {
            try {
                $accessToken = PersonalAccessToken::findToken($this->bearerToken());
                if ($accessToken) {
                    $user = $accessToken->tokenable;
                    // Set the user on the request so $this->user() works in rules()
                    $this->setUserResolver(function () use ($user) {
                        return $user;
                    });
                }
            } catch (\Exception $e) {
                // Token invalid or expired, treat as guest
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
        // User should already be set in prepareForValidation()
        $user = $this->user();

        // If user is authenticated, require address IDs
        if ($user) {
            return [
                'billing_address_id' => ['required', 'integer', 'exists:addresses,id'],
                'shipping_address_id' => ['required', 'integer', 'exists:addresses,id'],
                'shipping_method_id' => ['nullable', 'integer', 'exists:shipping_methods,id'],
                'shipping_cost' => ['nullable', 'numeric', 'min:0'],
                'shipping_option' => ['nullable', 'string', 'in:inside,outside'],
            ];
        }

        // For guest checkout, require address data, guest info, and cart items
        return [
            'billing_address' => ['required', 'array'],
            'billing_address.name' => ['required', 'string', 'max:255'],
            'billing_address.line1' => ['required', 'string', 'max:255'],
            'billing_address.city' => ['required', 'string', 'max:255'],
            'billing_address.country_code' => ['required', 'string', 'size:2'],
            'billing_address.contact_name' => ['nullable', 'string', 'max:255'],
            'billing_address.phone' => ['nullable', 'string', 'max:255'],
            'billing_address.line2' => ['nullable', 'string', 'max:255'],
            'billing_address.state_region' => ['nullable', 'string', 'max:255'],
            'billing_address.postal_code' => ['nullable', 'string', 'max:255'],

            'shipping_address' => ['required', 'array'],
            'shipping_address.name' => ['required', 'string', 'max:255'],
            'shipping_address.line1' => ['required', 'string', 'max:255'],
            'shipping_address.city' => ['required', 'string', 'max:255'],
            'shipping_address.country_code' => ['required', 'string', 'size:2'],
            'shipping_address.contact_name' => ['nullable', 'string', 'max:255'],
            'shipping_address.phone' => ['nullable', 'string', 'max:255'],
            'shipping_address.line2' => ['nullable', 'string', 'max:255'],
            'shipping_address.state_region' => ['nullable', 'string', 'max:255'],
            'shipping_address.postal_code' => ['nullable', 'string', 'max:255'],

            'guest_email' => ['required', 'email', 'max:255'],
            'guest_name' => ['required', 'string', 'max:255'],
            'cart_items' => ['required', 'array', 'min:1'],
            'cart_items.*.variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'cart_items.*.quantity' => ['required', 'integer', 'min:1'],
            'cart_items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'shipping_method_id' => ['nullable', 'integer', 'exists:shipping_methods,id'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'shipping_option' => ['nullable', 'string', 'in:inside,outside'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        // User should already be set in prepareForValidation()
        $user = $this->user();

        if ($user) {
            return [
                'billing_address_id.required' => 'Billing address is required.',
                'billing_address_id.exists' => 'The selected billing address does not exist.',
                'shipping_address_id.required' => 'Shipping address is required.',
                'shipping_address_id.exists' => 'The selected shipping address does not exist.',
                'shipping_method_id.exists' => 'The selected shipping method does not exist.',
            ];
        }

        return [
            'billing_address.required' => 'Billing address is required.',
            'billing_address.name.required' => 'Billing address name is required.',
            'billing_address.line1.required' => 'Billing address line 1 is required.',
            'billing_address.city.required' => 'Billing address city is required.',
            'billing_address.country_code.required' => 'Billing address country code is required.',

            'shipping_address.required' => 'Shipping address is required.',
            'shipping_address.name.required' => 'Shipping address name is required.',
            'shipping_address.line1.required' => 'Shipping address line 1 is required.',
            'shipping_address.city.required' => 'Shipping address city is required.',
            'shipping_address.country_code.required' => 'Shipping address country code is required.',

            'guest_email.required' => 'Email is required for guest checkout.',
            'guest_email.email' => 'Please provide a valid email address.',
            'guest_name.required' => 'Name is required for guest checkout.',
            'cart_items.required' => 'Cart items are required for guest checkout.',
            'cart_items.min' => 'At least one item is required.',
            'cart_items.*.variant_id.required' => 'Variant ID is required for each item.',
            'cart_items.*.variant_id.exists' => 'One or more variants do not exist.',
            'cart_items.*.quantity.required' => 'Quantity is required for each item.',
            'cart_items.*.quantity.min' => 'Quantity must be at least 1.',
            'cart_items.*.unit_price.required' => 'Unit price is required for each item.',
            'currency.required' => 'Currency is required for guest checkout.',
            'shipping_method_id.exists' => 'The selected shipping method does not exist.',
        ];
    }
}
