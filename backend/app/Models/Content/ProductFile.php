<?php

namespace App\Models\Content;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * ProductFile Model
 *
 * Represents a downloadable file or document associated with a product.
 * Useful for product manuals, certificates, warranties, or digital goods.
 */
class ProductFile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'product_id',
        'file_url',
        'title',
    ];

    /**
     * Get the product this file belongs to.
     */
    public function product()
    {
        return $this->belongsTo(\App\Models\Catalog\Product::class);
    }
}
