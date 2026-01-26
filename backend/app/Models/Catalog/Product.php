<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Product Model
 *
 * Represents a product in the catalog.
 * Supports different product types (simple, variant, bundle) and has many variants.
 * Includes SEO fields, dimensions, and publication status.
 */
class Product extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'short_description',
        'description',
        'brand_id',
        'product_type',
        'published_status',
        'visibility',
        'tax_class',
        'hs_code',
        'weight_grams',
        'length_mm',
        'width_mm',
        'height_mm',
        'is_featured',
        'is_upcoming',
        'call_for_price',
        'is_active',
        'seo_title',
        'seo_description',
        'sort_order',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weight_grams' => 'integer',
            'length_mm' => 'integer',
            'width_mm' => 'integer',
            'height_mm' => 'integer',
            'is_featured' => 'boolean',
            'is_upcoming' => 'boolean',
            'call_for_price' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the brand for this product.
     */
    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Get all categories for this product.
     */
    public function categories()
    {
        return $this->belongsToMany(
            Category::class,
            'product_categories',
            'product_id',
            'category_id'
        );
    }

    /**
     * Get all images for this product.
     */
    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('position');
    }

    /**
     * Get the primary image for this product.
     */
    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    /**
     * Get all variants for this product.
     */
    public function variants()
    {
        return $this->hasMany(\App\Models\Attribute\ProductVariant::class);
    }

    /**
     * Get all attribute values for this product (for filtering).
     */
    public function attributeValues()
    {
        return $this->belongsToMany(
            \App\Models\Attribute\AttributeValue::class,
            'product_attribute_values',
            'product_id',
            'attribute_value_id'
        );
    }

    /**
     * Get all files for this product.
     */
    public function files()
    {
        return $this->hasMany(\App\Models\Content\ProductFile::class);
    }

    /**
     * Get all meta data for this product.
     */
    public function meta()
    {
        return $this->hasMany(\App\Models\Content\ProductMeta::class);
    }

    /**
     * Check if the product is published.
     */
    public function isPublished(): bool
    {
        return $this->published_status === 'published' && $this->is_active;
    }

    /**
     * Check if the product is featured.
     */
    public function isFeatured(): bool
    {
        return $this->is_featured;
    }
}
