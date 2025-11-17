<?php

namespace App\Models\Order;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Fulfillment Model
 *
 * Represents a shipment/fulfillment for an order.
 * Tracks shipping status, carrier, and tracking information.
 * Supports partial fulfillments.
 */
class Fulfillment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'order_id',
        'status',
        'tracking_number',
        'carrier',
        'shipped_at',
        'delivered_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    /**
     * Get the order this fulfillment belongs to.
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get all items in this fulfillment.
     */
    public function items()
    {
        return $this->hasMany(FulfillmentItem::class);
    }

    /**
     * Check if the fulfillment is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the fulfillment is packed.
     */
    public function isPacked(): bool
    {
        return $this->status === 'packed';
    }

    /**
     * Check if the fulfillment is shipped.
     */
    public function isShipped(): bool
    {
        return $this->status === 'shipped';
    }

    /**
     * Check if the fulfillment is delivered.
     */
    public function isDelivered(): bool
    {
        return $this->status === 'delivered';
    }

    /**
     * Check if the fulfillment is canceled.
     */
    public function isCanceled(): bool
    {
        return $this->status === 'canceled';
    }

    /**
     * Check if the fulfillment is returned.
     */
    public function isReturned(): bool
    {
        return $this->status === 'returned';
    }
}
