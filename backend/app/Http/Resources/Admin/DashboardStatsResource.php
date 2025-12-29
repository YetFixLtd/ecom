<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Dashboard Stats Resource
 *
 * Formats dashboard statistics for API responses.
 */
class DashboardStatsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'revenue' => $this->resource['revenue'] ?? [],
            'orders' => $this->resource['orders'] ?? [],
            'products' => $this->resource['products'] ?? [],
            'customers' => $this->resource['customers'] ?? [],
            'average_order_value' => $this->resource['average_order_value'] ?? 0,
            'charts' => $this->resource['charts'] ?? [],
            'top_products' => $this->resource['top_products'] ?? [],
        ];
    }
}

