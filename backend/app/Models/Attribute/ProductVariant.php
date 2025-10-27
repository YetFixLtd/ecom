<?php

namespace App\Models\Attribute;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * ProductVariant Model
 *
 * Represents a specific SKU/variant of a product with unique attribute combinations.
 * Contains pricing, inventory tracking settings, and physical dimensions.
 */
class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'product_id',
        'sku',
        'barcode',
        'price',
        'compare_at_price',
        'cost_price',
        'currency',
        'track_stock',
        'allow_backorder',
        'weight_grams',
        'length_mm',
        'width_mm',
        'height_mm',
        'status',
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
            'compare_at_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'track_stock' => 'boolean',
            'allow_backorder' => 'boolean',
            'weight_grams' => 'integer',
            'length_mm' => 'integer',
            'width_mm' => 'integer',
            'height_mm' => 'integer',
        ];
    }

    /**
     * Get the product this variant belongs to.
     */
    public function product()
    {
        return $this->belongsTo(\App\Models\Catalog\Product::class);
    }

    /**
     * Get all attribute values for this variant.
     */
    public function attributeValues()
    {
        return $this->hasMany(VariantAttributeValue::class, 'variant_id');
    }

    /**
     * Get inventory items for this variant.
     */
    public function inventoryItems()
    {
        return $this->hasMany(\App\Models\Inventory\InventoryItem::class, 'variant_id');
    }

    /**
     * Get inventory movements for this variant.
     */
    public function inventoryMovements()
    {
        return $this->hasMany(\App\Models\Inventory\InventoryMovement::class, 'variant_id');
    }

    /**
     * Get price list items for this variant.
     */
    public function priceListItems()
    {
        return $this->hasMany(\App\Models\Pricing\PriceListItem::class, 'variant_id');
    }

    /**
     * Get cart items for this variant.
     */
    public function cartItems()
    {
        return $this->hasMany(\App\Models\Order\CartItem::class, 'variant_id');
    }

    /**
     * Get order items for this variant.
     */
    public function orderItems()
    {
        return $this->hasMany(\App\Models\Order\OrderItem::class, 'variant_id');
    }

    /**
     * Check if the variant is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if stock is tracked for this variant.
     */
    public function tracksStock(): bool
    {
        return $this->track_stock;
    }

    /**
     * Check if backorders are allowed.
     */
    public function allowsBackorder(): bool
    {
        return $this->allow_backorder;
    }
}
