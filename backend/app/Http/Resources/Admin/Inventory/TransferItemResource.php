<?php

namespace App\Http\Resources\Admin\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransferItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transfer_id' => $this->transfer_id,
            'variant_id' => $this->variant_id,
            'qty' => $this->qty,
            'variant' => $this->whenLoaded('variant'),
        ];
    }
}
