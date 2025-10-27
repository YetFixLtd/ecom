<?php

namespace App\Models\Pricing;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * PriceList Model
 *
 * Represents a custom pricing schedule for specific customer segments, regions, or time periods.
 * Optional feature for advanced pricing strategies.
 */
class PriceList extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'currency',
        'starts_at',
        'ends_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    /**
     * Get all items in this price list.
     */
    public function items()
    {
        return $this->hasMany(PriceListItem::class);
    }

    /**
     * Check if the price list is currently active.
     */
    public function isActive(): bool
    {
        $now = now();

        $startsOk = is_null($this->starts_at) || $this->starts_at <= $now;
        $endsOk = is_null($this->ends_at) || $this->ends_at >= $now;

        return $startsOk && $endsOk;
    }
}
