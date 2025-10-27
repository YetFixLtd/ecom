<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * TransferItem Model
 *
 * Represents an individual line item in a warehouse transfer.
 * Links variants with quantities to transfer orders.
 */
class TransferItem extends Model
{
    use HasFactory;

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'transfer_id',
        'variant_id',
        'qty',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'qty' => 'integer',
        ];
    }

    /**
     * Get the transfer this item belongs to.
     */
    public function transfer()
    {
        return $this->belongsTo(Transfer::class);
    }

    /**
     * Get the variant for this transfer item.
     */
    public function variant()
    {
        return $this->belongsTo(\App\Models\Attribute\ProductVariant::class, 'variant_id');
    }
}
