<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\ApiFormRequest;

class AttributeValueUpdateRequest extends ApiFormRequest
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
            'value' => ['sometimes', 'required', 'string', 'max:100'],
            'value_key' => ['nullable', 'string', 'max:100'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

