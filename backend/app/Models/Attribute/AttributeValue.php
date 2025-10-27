<?php

namespace App\Models\Attribute;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * AttributeValue Model
 *
 * Represents a specific value for an attribute (e.g., "Red" for Color, "Large" for Size).
 * Can include a value_key for additional data like hex codes for colors.
 */
class AttributeValue extends Model
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
        'attribute_id',
        'value',
        'value_key',
        'position',
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
        ];
    }

    /**
     * Get the attribute this value belongs to.
     */
    public function attribute()
    {
        return $this->belongsTo(Attribute::class);
    }

    /**
     * Get all products using this attribute value (for filtering).
     */
    public function products()
    {
        return $this->belongsToMany(
            \App\Models\Catalog\Product::class,
            'product_attribute_values',
            'attribute_value_id',
            'product_id'
        );
    }

    /**
     * Get all variant attribute values using this value.
     */
    public function variantAttributeValues()
    {
        return $this->hasMany(VariantAttributeValue::class);
    }
}
