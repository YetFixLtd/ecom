<?php

namespace App\Models\Attribute;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * VariantAttributeValue Model
 *
 * Pivot model linking variants to their specific attribute values.
 * Each variant has one value per attribute (e.g., Color: Red, Size: Large).
 */
class VariantAttributeValue extends Model
{
    use HasFactory;

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'variant_attribute_values';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'variant_id',
        'attribute_id',
        'attribute_value_id',
    ];

    /**
     * Get the variant this belongs to.
     */
    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    /**
     * Get the attribute.
     */
    public function attribute()
    {
        return $this->belongsTo(Attribute::class);
    }

    /**
     * Get the attribute value.
     */
    public function attributeValue()
    {
        return $this->belongsTo(AttributeValue::class);
    }
}
