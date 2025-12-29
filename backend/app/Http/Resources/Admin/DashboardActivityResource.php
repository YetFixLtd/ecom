<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Dashboard Activity Resource
 *
 * Formats activity feed items for API responses.
 */
class DashboardActivityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'type' => $this->resource['type'],
            'title' => $this->resource['title'],
            'description' => $this->resource['description'],
            'amount' => $this->resource['amount'],
            'currency' => $this->resource['currency'],
            'timestamp' => $this->resource['timestamp'] instanceof \Carbon\Carbon
                ? $this->resource['timestamp']->toIso8601String()
                : $this->resource['timestamp'],
            'metadata' => $this->resource['metadata'] ?? [],
        ];
    }
}

