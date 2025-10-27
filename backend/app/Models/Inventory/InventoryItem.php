<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * InventoryItem Model
 *
 * Represents current stock levels for a variant in a warehouse.
 * Tracks on_hand and reserved quantities.
 * Available stock = on_hand - reserved.
 */
class InventoryItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'variant_id',
        'warehouse_id',
        'on_hand',
        'reserved',
        'safety_stock',
        'reorder_point',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'on_hand' => 'integer',
            'reserved' => 'integer',
            'safety_stock' => 'integer',
            'reorder_point' => 'integer',
        ];
    }

    /**
     * Get the variant for this inventory item.
     */
    public function variant()
    {
        return $this->belongsTo(\App\Models\Attribute\ProductVariant::class, 'variant_id');
    }

    /**
     * Get the warehouse for this inventory item.
     */
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get available stock (on_hand - reserved).
     */
    public function getAvailableAttribute(): int
    {
        return max(0, $this->on_hand - $this->reserved);
    }

    /**
     * Check if stock is below safety level.
     */
    public function isBelowSafetyStock(): bool
    {
        return $this->on_hand < $this->safety_stock;
    }

    /**
     * Check if stock is at or below reorder point.
     */
    public function needsReorder(): bool
    {
        return $this->on_hand <= $this->reorder_point;
    }
}
