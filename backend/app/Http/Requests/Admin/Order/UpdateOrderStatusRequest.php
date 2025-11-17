<?php

namespace App\Http\Requests\Admin\Order;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends ApiFormRequest
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
                Rule::in(['pending', 'paid', 'fulfilled', 'canceled', 'refunded']),
            ],
        ];
    }
}

