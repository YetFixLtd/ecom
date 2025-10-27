<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Transfer Model
 *
 * Represents a stock transfer between warehouses.
 * Tracks transfer status and line items.
 */
class Transfer extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'from_warehouse_id',
        'to_warehouse_id',
        'status',
        'created_by',
    ];

    /**
     * Get the source warehouse.
     */
    public function fromWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    /**
     * Get the destination warehouse.
     */
    public function toWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    /**
     * Get the administrator who created this transfer.
     */
    public function createdBy()
    {
        return $this->belongsTo(\App\Models\Administrator::class, 'created_by');
    }

    /**
     * Get all items in this transfer.
     */
    public function items()
    {
        return $this->hasMany(TransferItem::class);
    }

    /**
     * Check if the transfer is in draft status.
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if the transfer is in transit.
     */
    public function isInTransit(): bool
    {
        return $this->status === 'in_transit';
    }

    /**
     * Check if the transfer has been received.
     */
    public function isReceived(): bool
    {
        return $this->status === 'received';
    }

    /**
     * Check if the transfer is canceled.
     */
    public function isCanceled(): bool
    {
        return $this->status === 'canceled';
    }
}
