<?php

namespace Tests\Feature;

use App\Models\Administrator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test super_admin can list all administrators.
     */
    public function test_super_admin_can_list_all_administrators(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        Administrator::factory()->count(5)->create();

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'email',
                        'first_name',
                        'last_name',
                        'role',
                        'is_active',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);

        $this->assertEquals(6, $response->json('meta.total')); // 1 super_admin + 5 created
    }

    /**
     * Test non super_admin cannot list administrators.
     */
    public function test_non_super_admin_cannot_list_administrators(): void
    {
        $admin = Administrator::factory()->admin()->create();
        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators');

        $response->assertStatus(403);
    }

    /**
     * Test super_admin can create new administrator.
     */
    public function test_super_admin_can_create_new_administrator(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/administrators', [
                'email' => 'newadmin@example.com',
                'password' => 'SecurePassword123!',
                'password_confirmation' => 'SecurePassword123!',
                'first_name' => 'New',
                'last_name' => 'Admin',
                'phone' => '+1234567890',
                'role' => 'manager',
                'is_active' => true,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Administrator created successfully.',
                'data' => [
                    'email' => 'newadmin@example.com',
                    'first_name' => 'New',
                    'last_name' => 'Admin',
                    'role' => 'manager',
                ],
            ]);

        $this->assertDatabaseHas('administrators', [
            'email' => 'newadmin@example.com',
            'first_name' => 'New',
            'last_name' => 'Admin',
            'role' => 'manager',
        ]);
    }

    /**
     * Test non super_admin cannot create administrator.
     */
    public function test_non_super_admin_cannot_create_administrator(): void
    {
        $admin = Administrator::factory()->manager()->create();
        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/administrators', [
                'email' => 'newadmin@example.com',
                'password' => 'SecurePassword123!',
                'password_confirmation' => 'SecurePassword123!',
                'first_name' => 'New',
                'last_name' => 'Admin',
                'role' => 'staff',
            ]);

        $response->assertStatus(403);
    }

    /**
     * Test super_admin can view administrator details.
     */
    public function test_super_admin_can_view_administrator_details(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $admin = Administrator::factory()->create([
            'email' => 'target@example.com',
            'first_name' => 'Target',
            'last_name' => 'Admin',
        ]);

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/administrators/{$admin->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $admin->id,
                    'email' => 'target@example.com',
                    'first_name' => 'Target',
                    'last_name' => 'Admin',
                ],
            ]);
    }

    /**
     * Test super_admin can update administrator.
     */
    public function test_super_admin_can_update_administrator(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $admin = Administrator::factory()->create([
            'first_name' => 'Old',
            'role' => 'staff',
        ]);

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/admin/administrators/{$admin->id}", [
                'first_name' => 'Updated',
                'role' => 'manager',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Administrator updated successfully.',
                'data' => [
                    'first_name' => 'Updated',
                    'role' => 'manager',
                ],
            ]);

        $this->assertDatabaseHas('administrators', [
            'id' => $admin->id,
            'first_name' => 'Updated',
            'role' => 'manager',
        ]);
    }

    /**
     * Test super_admin cannot change their own role.
     */
    public function test_super_admin_cannot_change_their_own_role(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/admin/administrators/{$superAdmin->id}", [
                'role' => 'admin',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'You cannot change your own role.',
            ]);
    }

    /**
     * Test super_admin can delete administrator.
     */
    public function test_super_admin_can_delete_administrator(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $admin = Administrator::factory()->create();

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/administrators/{$admin->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Administrator deleted successfully.',
            ]);

        $this->assertSoftDeleted('administrators', [
            'id' => $admin->id,
        ]);
    }

    /**
     * Test super_admin cannot delete themselves.
     */
    public function test_super_admin_cannot_delete_themselves(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/administrators/{$superAdmin->id}");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'You cannot delete your own account.',
            ]);
    }

    /**
     * Test super_admin can activate administrator.
     */
    public function test_super_admin_can_activate_administrator(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $admin = Administrator::factory()->inactive()->create();

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/administrators/{$admin->id}/activate");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Administrator activated successfully.',
                'data' => [
                    'is_active' => true,
                ],
            ]);

        $this->assertDatabaseHas('administrators', [
            'id' => $admin->id,
            'is_active' => true,
        ]);
    }

    /**
     * Test super_admin can deactivate administrator.
     */
    public function test_super_admin_can_deactivate_administrator(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $admin = Administrator::factory()->create(['is_active' => true]);

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/administrators/{$admin->id}/deactivate");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Administrator deactivated successfully.',
                'data' => [
                    'is_active' => false,
                ],
            ]);

        $this->assertDatabaseHas('administrators', [
            'id' => $admin->id,
            'is_active' => false,
        ]);
    }

    /**
     * Test super_admin cannot deactivate themselves.
     */
    public function test_super_admin_cannot_deactivate_themselves(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/administrators/{$superAdmin->id}/deactivate");

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'You cannot deactivate your own account.',
            ]);
    }

    /**
     * Test deactivating administrator revokes their tokens.
     */
    public function test_deactivating_administrator_revokes_their_tokens(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $admin = Administrator::factory()->create();

        // Create token for the admin to be deactivated
        $admin->createToken('test-token')->plainTextToken;
        $this->assertCount(1, $admin->tokens);

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/administrators/{$admin->id}/deactivate");

        // Verify tokens are revoked
        $admin->refresh();
        $this->assertCount(0, $admin->tokens);
    }

    /**
     * Test administrator list can be filtered by role.
     */
    public function test_administrator_list_can_be_filtered_by_role(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        Administrator::factory()->manager()->count(3)->create();
        Administrator::factory()->staff()->count(2)->create();

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators?role=manager');

        $response->assertStatus(200);
        $this->assertEquals(3, $response->json('meta.total'));
    }

    /**
     * Test administrator list can be filtered by active status.
     */
    public function test_administrator_list_can_be_filtered_by_active_status(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        Administrator::factory()->count(3)->create(['is_active' => true]);
        Administrator::factory()->count(2)->create(['is_active' => false]);

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators?is_active=1');

        $response->assertStatus(200);
        $this->assertEquals(4, $response->json('meta.total')); // 3 + 1 super_admin
    }

    /**
     * Test administrator list can be searched.
     */
    public function test_administrator_list_can_be_searched(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        Administrator::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);
        Administrator::factory()->create(['first_name' => 'Jane', 'last_name' => 'Smith']);
        Administrator::factory()->create(['email' => 'specific@example.com']);

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators?search=John');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('meta.total'));
    }

    /**
     * Test create administrator validation.
     */
    public function test_create_administrator_validation(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/administrators', [
                'email' => 'invalid-email',
                'password' => 'short',
                'role' => 'invalid_role',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password', 'role', 'first_name', 'last_name']);
    }

    /**
     * Test cannot create administrator with duplicate email.
     */
    public function test_cannot_create_administrator_with_duplicate_email(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        Administrator::factory()->create(['email' => 'existing@example.com']);

        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/administrators', [
                'email' => 'existing@example.com',
                'password' => 'SecurePassword123!',
                'password_confirmation' => 'SecurePassword123!',
                'first_name' => 'Test',
                'last_name' => 'User',
                'role' => 'staff',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
