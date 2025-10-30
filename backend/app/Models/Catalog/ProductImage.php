<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * ProductImage Model
 *
 * Represents an image associated with a product.
 * Supports multiple images per product with ordering and primary designation.
 */
class ProductImage extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'product_id',
        'url',
        'path_original',
        'path_medium',
        'path_thumb',
        'alt_text',
        'position',
        'is_primary',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_primary' => 'boolean',
        ];
    }

    /**
     * Get the product that owns this image.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
