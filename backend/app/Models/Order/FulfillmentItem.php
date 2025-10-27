<?php

namespace App\Models\Order;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * FulfillmentItem Model
 *
 * Represents individual items included in a fulfillment/shipment.
 * Links order items to fulfillments with quantities for partial fulfillment support.
 */
class FulfillmentItem extends Model
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
        'fulfillment_id',
        'order_item_id',
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
     * Get the fulfillment this item belongs to.
     */
    public function fulfillment()
    {
        return $this->belongsTo(Fulfillment::class);
    }

    /**
     * Get the order item for this fulfillment item.
     */
    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }
}
