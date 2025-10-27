<?php

namespace App\Models\Attribute;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Attribute Model
 *
 * Represents a product attribute (e.g., Color, Size, Material).
 * Used to define configurable options for product variants.
 */
class Attribute extends Model
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
        'name',
        'slug',
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
     * Get all values for this attribute.
     */
    public function values()
    {
        return $this->hasMany(AttributeValue::class)->orderBy('position');
    }

    /**
     * Get all variant attribute values using this attribute.
     */
    public function variantAttributeValues()
    {
        return $this->hasMany(VariantAttributeValue::class);
    }
}
