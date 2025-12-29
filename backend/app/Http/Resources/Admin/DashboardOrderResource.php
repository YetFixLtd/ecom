<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Dashboard Order Resource
 *
 * Simplified order resource for dashboard display.
 */
class DashboardOrderResource extends JsonResource
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
            'order_number' => $this->order_number,
            'status' => $this->status,
            'currency' => $this->currency,
            'grand_total' => (float) $this->grand_total,
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'email' => $this->user->email,
                    'full_name' => $this->user->full_name,
                ];
            }),
            'created_at' => $this->created_at->toIso8601String(),
            'placed_at' => $this->placed_at?->toIso8601String(),
        ];
    }
}

