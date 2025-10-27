<?php

namespace App\Models\Order;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * CartItem Model
 *
 * Represents an individual item in a shopping cart.
 * Captures price snapshot at the time of adding to cart.
 */
class CartItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'cart_id',
        'variant_id',
        'qty',
        'unit_price',
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
            'unit_price' => 'decimal:2',
        ];
    }

    /**
     * Get the cart this item belongs to.
     */
    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    /**
     * Get the variant for this cart item.
     */
    public function variant()
    {
        return $this->belongsTo(\App\Models\Attribute\ProductVariant::class, 'variant_id');
    }

    /**
     * Get the line total (qty * unit_price).
     */
    public function getLineTotalAttribute(): float
    {
        return $this->qty * $this->unit_price;
    }
}
