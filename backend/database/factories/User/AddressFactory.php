<?php

namespace Database\Factories\User;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User\Address>
 */
class AddressFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(['Home', 'Office', 'Work', 'Other']),
            'contact_name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'line1' => fake()->streetAddress(),
            'line2' => fake()->optional()->secondaryAddress(),
            'city' => fake()->city(),
            'state_region' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'country_code' => fake()->randomElement(['US', 'BD', 'GB', 'CA']),
            'is_default_billing' => false,
            'is_default_shipping' => false,
        ];
    }
}
