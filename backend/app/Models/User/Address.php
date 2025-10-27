<?php

namespace App\Models\User;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Address Model
 *
 * Represents a user's shipping or billing address.
 * Supports multiple addresses per user with default flags for billing and shipping.
 */
class Address extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'contact_name',
        'phone',
        'line1',
        'line2',
        'city',
        'state_region',
        'postal_code',
        'country_code',
        'is_default_billing',
        'is_default_shipping',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default_billing' => 'boolean',
            'is_default_shipping' => 'boolean',
        ];
    }

    /**
     * Get the user that owns this address.
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    /**
     * Get orders using this address as billing address.
     */
    public function ordersAsBillingAddress()
    {
        return $this->hasMany(\App\Models\Order\Order::class, 'billing_address_id');
    }

    /**
     * Get orders using this address as shipping address.
     */
    public function ordersAsShippingAddress()
    {
        return $this->hasMany(\App\Models\Order\Order::class, 'shipping_address_id');
    }

    /**
     * Get the full address as a single string.
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->line1,
            $this->line2,
            $this->city,
            $this->state_region,
            $this->postal_code,
            $this->country_code,
        ]);

        return implode(', ', $parts);
    }
}
