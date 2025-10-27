<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * InventoryMovement Model
 *
 * Immutable ledger of all inventory transactions.
 * Records every stock change for audit trail and COGS calculation.
 * Never edit existing movements - create compensating entries instead.
 */
class InventoryMovement extends Model
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
        'qty_change',
        'movement_type',
        'reference_type',
        'reference_id',
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
            'qty_change' => 'integer',
            'reference_id' => 'integer',
            'unit_cost' => 'decimal:2',
            'performed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Get the variant for this movement.
     */
    public function variant()
    {
        return $this->belongsTo(\App\Models\Attribute\ProductVariant::class, 'variant_id');
    }

    /**
     * Get the warehouse for this movement.
     */
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the administrator who performed this movement.
     */
    public function performedBy()
    {
        return $this->belongsTo(\App\Models\Administrator::class, 'performed_by');
    }

    /**
     * Check if this is an incoming movement (positive qty).
     */
    public function isIncoming(): bool
    {
        return $this->qty_change > 0;
    }

    /**
     * Check if this is an outgoing movement (negative qty).
     */
    public function isOutgoing(): bool
    {
        return $this->qty_change < 0;
    }
}
