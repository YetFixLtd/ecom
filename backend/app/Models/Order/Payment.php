<?php

namespace App\Models\Order;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Payment Model
 *
 * Represents a payment transaction for an order.
 * Supports multiple payment providers (Stripe, bKash, Nagad, COD, SSL Commerce, etc.).
 */
class Payment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'order_id',
        'payment_method_id',
        'provider',
        'provider_ref',
        'amount',
        'currency',
        'status',
        'paid_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * Get the order this payment belongs to.
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the payment method for this payment.
     */
    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    /**
     * Check if the payment is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the payment is authorized.
     */
    public function isAuthorized(): bool
    {
        return $this->status === 'authorized';
    }

    /**
     * Check if the payment is captured.
     */
    public function isCaptured(): bool
    {
        return $this->status === 'captured';
    }

    /**
     * Check if the payment failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if the payment is refunded.
     */
    public function isRefunded(): bool
    {
        return $this->status === 'refunded';
    }

    /**
     * Check if this is a Cash on Delivery payment.
     */
    public function isCashOnDelivery(): bool
    {
        return $this->provider === 'cod';
    }

    /**
     * Check if this is an online payment (not COD).
     */
    public function isOnlinePayment(): bool
    {
        return !$this->isCashOnDelivery();
    }

    /**
     * Get display name for the payment provider.
     */
    public function getProviderDisplayName(): string
    {
        return match ($this->provider) {
            'cod' => 'Cash on Delivery',
            'bkash' => 'bKash',
            'nagad' => 'Nagad',
            'ssl_commerz' => 'SSL Commerce',
            'stripe' => 'Credit/Debit Card',
            'bank_transfer' => 'Bank Transfer',
            default => ucfirst($this->provider),
        };
    }
}
