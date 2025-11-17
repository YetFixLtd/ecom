<?php

namespace App\Http\Requests\Admin\Fulfillment;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class UpdateFulfillmentStatusRequest extends ApiFormRequest
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
            'status' => [
                'required',
                'string',
                Rule::in(['pending', 'packed', 'shipped', 'delivered', 'canceled', 'returned']),
            ],
        ];
    }
}

