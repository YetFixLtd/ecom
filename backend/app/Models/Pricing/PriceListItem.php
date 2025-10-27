<?php

namespace App\Models\Pricing;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * PriceListItem Model
 *
 * Links specific variants to price lists with custom pricing.
 * Pivot model for price list and variant relationship.
 */
class PriceListItem extends Model
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
        'price_list_id',
        'variant_id',
        'price',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
        ];
    }

    /**
     * Get the price list this item belongs to.
     */
    public function priceList()
    {
        return $this->belongsTo(PriceList::class);
    }

    /**
     * Get the variant for this price list item.
     */
    public function variant()
    {
        return $this->belongsTo(\App\Models\Attribute\ProductVariant::class, 'variant_id');
    }
}
