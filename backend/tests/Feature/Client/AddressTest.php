<?php

namespace Tests\Feature\Client;

use App\Models\User;
use App\Models\User\Address;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddressTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user can list their addresses.
     */
    public function test_user_can_list_their_addresses(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        Address::factory()->count(3)->create(['user_id' => $user->id]);
        Address::factory()->count(2)->create(); // Other user's addresses

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/addresses');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'line1',
                        'city',
                        'country_code',
                        'is_default_billing',
                        'is_default_shipping',
                        'created_at',
                        'updated_at',
                    ],
                ],
            ]);

        // Should only return user's addresses
        $this->assertCount(3, $response->json('data'));
    }

    /**
     * Test user can create an address.
     */
    public function test_user_can_create_address(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $addressData = [
            'name' => 'Home',
            'contact_name' => 'John Doe',
            'phone' => '+1234567890',
            'line1' => '123 Main St',
            'line2' => 'Apt 4B',
            'city' => 'New York',
            'state_region' => 'NY',
            'postal_code' => '10001',
            'country_code' => 'US',
            'is_default_billing' => true,
            'is_default_shipping' => true,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/addresses', $addressData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'name',
                    'line1',
                    'city',
                    'country_code',
                ],
            ])
            ->assertJson([
                'message' => 'Address created successfully.',
                'data' => [
                    'name' => 'Home',
                    'line1' => '123 Main St',
                    'city' => 'New York',
                    'country_code' => 'US',
                    'is_default_billing' => true,
                    'is_default_shipping' => true,
                ],
            ]);

        $this->assertDatabaseHas('addresses', [
            'user_id' => $user->id,
            'name' => 'Home',
            'line1' => '123 Main St',
            'city' => 'New York',
        ]);
    }

    /**
     * Test address creation fails without required fields.
     */
    public function test_address_creation_fails_without_required_fields(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/addresses', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'line1', 'city', 'country_code']);
    }

    /**
     * Test address creation sets only one default billing address.
     */
    public function test_address_creation_sets_only_one_default_billing(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        // Create first default billing address
        Address::factory()->create([
            'user_id' => $user->id,
            'is_default_billing' => true,
        ]);

        // Create second default billing address
        $addressData = [
            'name' => 'Office',
            'line1' => '456 Work St',
            'city' => 'New York',
            'country_code' => 'US',
            'is_default_billing' => true,
        ];

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/addresses', $addressData);

        // First address should no longer be default
        $this->assertDatabaseHas('addresses', [
            'user_id' => $user->id,
            'name' => 'Office',
            'is_default_billing' => true,
        ]);

        $this->assertEquals(1, $user->addresses()->where('is_default_billing', true)->count());
    }

    /**
     * Test user can view their address.
     */
    public function test_user_can_view_their_address(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $address = Address::factory()->create([
            'user_id' => $user->id,
            'name' => 'Home',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/addresses/{$address->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $address->id,
                    'name' => 'Home',
                ],
            ]);
    }

    /**
     * Test user cannot view other user's address.
     */
    public function test_user_cannot_view_other_users_address(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $address = Address::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/addresses/{$address->id}");

        $response->assertStatus(404);
    }

    /**
     * Test user can update their address.
     */
    public function test_user_can_update_their_address(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $address = Address::factory()->create([
            'user_id' => $user->id,
            'name' => 'Home',
            'city' => 'New York',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/addresses/{$address->id}", [
                'name' => 'Office',
                'line1' => $address->line1,
                'city' => 'Boston',
                'country_code' => $address->country_code,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Address updated successfully.',
                'data' => [
                    'name' => 'Office',
                    'city' => 'Boston',
                ],
            ]);

        $this->assertDatabaseHas('addresses', [
            'id' => $address->id,
            'name' => 'Office',
            'city' => 'Boston',
        ]);
    }

    /**
     * Test user cannot update other user's address.
     */
    public function test_user_cannot_update_other_users_address(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $address = Address::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/addresses/{$address->id}", [
                'name' => 'Hacked',
                'line1' => $address->line1,
                'city' => $address->city,
                'country_code' => $address->country_code,
            ]);

        $response->assertStatus(404);
    }

    /**
     * Test user can delete their address.
     */
    public function test_user_can_delete_their_address(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $address = Address::factory()->create(['user_id' => $user->id]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/addresses/{$address->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Address deleted successfully.',
            ]);

        $this->assertDatabaseMissing('addresses', ['id' => $address->id]);
    }

    /**
     * Test user cannot delete other user's address.
     */
    public function test_user_cannot_delete_other_users_address(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $address = Address::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/addresses/{$address->id}");

        $response->assertStatus(404);
    }

    /**
     * Test user can set default billing address.
     */
    public function test_user_can_set_default_billing_address(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $oldDefault = Address::factory()->create([
            'user_id' => $user->id,
            'is_default_billing' => true,
        ]);

        $newDefault = Address::factory()->create([
            'user_id' => $user->id,
            'is_default_billing' => false,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/addresses/{$newDefault->id}/set-default-billing");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Default billing address updated successfully.',
                'data' => [
                    'id' => $newDefault->id,
                    'is_default_billing' => true,
                ],
            ]);

        // Old default should be unset
        $this->assertDatabaseHas('addresses', [
            'id' => $oldDefault->id,
            'is_default_billing' => false,
        ]);

        // New default should be set
        $this->assertDatabaseHas('addresses', [
            'id' => $newDefault->id,
            'is_default_billing' => true,
        ]);
    }

    /**
     * Test user can set default shipping address.
     */
    public function test_user_can_set_default_shipping_address(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $oldDefault = Address::factory()->create([
            'user_id' => $user->id,
            'is_default_shipping' => true,
        ]);

        $newDefault = Address::factory()->create([
            'user_id' => $user->id,
            'is_default_shipping' => false,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/addresses/{$newDefault->id}/set-default-shipping");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Default shipping address updated successfully.',
                'data' => [
                    'id' => $newDefault->id,
                    'is_default_shipping' => true,
                ],
            ]);

        // Old default should be unset
        $this->assertDatabaseHas('addresses', [
            'id' => $oldDefault->id,
            'is_default_shipping' => false,
        ]);

        // New default should be set
        $this->assertDatabaseHas('addresses', [
            'id' => $newDefault->id,
            'is_default_shipping' => true,
        ]);
    }

    /**
     * Test unauthenticated user cannot access addresses.
     */
    public function test_unauthenticated_user_cannot_access_addresses(): void
    {
        $response = $this->getJson('/api/v1/addresses');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }
}

