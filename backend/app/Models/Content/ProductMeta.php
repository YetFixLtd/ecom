<?php

namespace App\Models\Content;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * ProductMeta Model
 *
 * Stores custom key-value metadata for products.
 * Provides flexible storage for product-specific data without schema changes.
 * Can be used for custom fields, integrations, or extended attributes.
 */
class ProductMeta extends Model
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
        'product_id',
        'meta_key',
        'meta_value',
    ];

    /**
     * Get the product this meta belongs to.
     */
    public function product()
    {
        return $this->belongsTo(\App\Models\Catalog\Product::class);
    }
}
