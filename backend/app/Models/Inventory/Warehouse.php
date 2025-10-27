<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Warehouse Model
 *
 * Represents a physical warehouse or storage location for inventory.
 * Supports multi-warehouse inventory management.
 */
class Warehouse extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'code',
        'address1',
        'address2',
        'city',
        'state_region',
        'postal_code',
        'country_code',
        'is_default',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    /**
     * Get all inventory items in this warehouse.
     */
    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class);
    }

    /**
     * Get all inventory movements for this warehouse.
     */
    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }

    /**
     * Get all inventory adjustments for this warehouse.
     */
    public function inventoryAdjustments()
    {
        return $this->hasMany(InventoryAdjustment::class);
    }

    /**
     * Get transfers originating from this warehouse.
     */
    public function transfersFrom()
    {
        return $this->hasMany(Transfer::class, 'from_warehouse_id');
    }

    /**
     * Get transfers destined to this warehouse.
     */
    public function transfersTo()
    {
        return $this->hasMany(Transfer::class, 'to_warehouse_id');
    }
}
