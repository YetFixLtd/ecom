<?php

namespace App\Models\Order;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Payment Method Model
 *
 * Represents a configured payment method available for orders.
 * Supports online payments, COD, wallets, and bank transfers.
 */
class PaymentMethod extends Model
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
        'provider',
        'description',
        'type',
        'processing_fee',
        'fee_type',
        'min_amount',
        'max_amount',
        'requires_online_payment',
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
            'processing_fee' => 'decimal:2',
            'min_amount' => 'decimal:2',
            'max_amount' => 'decimal:2',
            'requires_online_payment' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'config' => 'array',
        ];
    }

    /**
     * Get all payments using this payment method.
     */
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Check if the payment method is active.
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Check if the payment method is Cash on Delivery.
     */
    public function isCashOnDelivery(): bool
    {
        return $this->type === 'cod';
    }

    /**
     * Check if this is an online payment method.
     */
    public function isOnlinePayment(): bool
    {
        return $this->requires_online_payment && $this->type !== 'cod';
    }

    /**
     * Check if the payment method is available for the given amount.
     */
    public function isAvailableForAmount(float $amount): bool
    {
        if ($this->min_amount !== null && $amount < $this->min_amount) {
            return false;
        }

        if ($this->max_amount !== null && $amount > $this->max_amount) {
            return false;
        }

        return true;
    }

    /**
     * Calculate processing fee for a given amount.
     */
    public function calculateProcessingFee(float $amount): float
    {
        if ($this->fee_type === 'percentage') {
            return ($amount * $this->processing_fee) / 100;
        }

        return $this->processing_fee;
    }

    /**
     * Scope to get only active payment methods.
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
