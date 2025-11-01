<?php

namespace App\Http\Requests\Admin;

use App\Http\Requests\ApiFormRequest;
use Illuminate\Validation\Rule;

class BrandUpdateRequest extends ApiFormRequest
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
        $brandId = $this->route('id') ?? $this->route('brand');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:191', Rule::unique('brands', 'name')->ignore($brandId)],
            'slug' => ['nullable', 'string', 'max:191', Rule::unique('brands', 'slug')->ignore($brandId)],
            'website_url' => ['nullable', 'url', 'max:255'],
            'logo_url' => ['nullable', 'url', 'max:255'],
        ];
    }
}

