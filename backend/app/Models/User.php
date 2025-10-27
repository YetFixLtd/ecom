<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * User Model
 *
 * Represents a customer or admin user account in the e-commerce system.
 * Supports authentication, profile management, and soft deletes.
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'password_hash',
        'first_name',
        'last_name',
        'phone',
        'is_active',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the password attribute for authentication.
     */
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    /**
     * Get all addresses for this user.
     */
    public function addresses()
    {
        return $this->hasMany(\App\Models\User\Address::class);
    }

    /**
     * Get the default billing address.
     */
    public function defaultBillingAddress()
    {
        return $this->hasOne(\App\Models\User\Address::class)->where('is_default_billing', true);
    }

    /**
     * Get the default shipping address.
     */
    public function defaultShippingAddress()
    {
        return $this->hasOne(\App\Models\User\Address::class)->where('is_default_shipping', true);
    }

    /**
     * Get all carts for this user.
     */
    public function carts()
    {
        return $this->hasMany(\App\Models\Order\Cart::class);
    }

    /**
     * Get all orders for this user.
     */
    public function orders()
    {
        return $this->hasMany(\App\Models\Order\Order::class);
    }
}
