<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * InventoryAdjustment Model
 *
 * Records human-initiated stock adjustments.
 * Used for cycle counts, damage, loss, and manual corrections.
 * Each adjustment creates a corresponding inventory_movement record.
 */
class InventoryAdjustment extends Model
{
    use HasFactory;

    const UPDATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'variant_id',
        'warehouse_id',
        'adjustment_mode',
        'qty_before',
        'qty_change',
        'qty_after',
        'unit_cost',
        'reason_code',
        'note',
        'performed_by',
        'performed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'qty_before' => 'integer',
            'qty_change' => 'integer',
            'qty_after' => 'integer',
            'unit_cost' => 'decimal:2',
            'performed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Get the variant for this adjustment.
     */
    public function variant()
    {
        return $this->belongsTo(\App\Models\Attribute\ProductVariant::class, 'variant_id');
    }

    /**
     * Get the warehouse for this adjustment.
     */
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the administrator who performed this adjustment.
     */
    public function performedBy()
    {
        return $this->belongsTo(\App\Models\Administrator::class, 'performed_by');
    }
}
