<?php

namespace App\Models\Order;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Shipping Method Model
 *
 * Represents a configured shipping method available for orders.
 * Supports various calculation types (flat, weight-based, price-based, etc.).
 */
class ShippingMethod extends Model
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
        'carrier',
        'description',
        'calculation_type',
        'base_rate',
        'per_kg_rate',
        'per_item_rate',
        'free_shipping_threshold',
        'max_weight_kg',
        'estimated_days',
        'is_active',
        'sort_order',
        'config',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_rate' => 'decimal:2',
            'per_kg_rate' => 'decimal:2',
            'per_item_rate' => 'decimal:2',
            'free_shipping_threshold' => 'decimal:2',
            'max_weight_kg' => 'decimal:2',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'config' => 'array',
        ];
    }

    /**
     * Get all orders using this shipping method.
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Check if the shipping method is active.
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Check if shipping is free for the given order total.
     */
    public function isFreeShippingForAmount(float $orderTotal): bool
    {
        return $this->free_shipping_threshold !== null
            && $orderTotal >= $this->free_shipping_threshold;
    }

    /**
     * Scope to get only active shipping methods.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
