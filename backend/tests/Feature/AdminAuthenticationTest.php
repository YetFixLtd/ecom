<?php

namespace Tests\Feature;

use App\Models\Administrator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test admin can login with valid credentials.
     */
    public function test_admin_can_login_with_valid_credentials(): void
    {
        $admin = Administrator::factory()->create([
            'email' => 'admin@example.com',
            'password_hash' => Hash::make('SecurePassword123!'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'SecurePassword123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'administrator' => [
                        'id',
                        'email',
                        'first_name',
                        'last_name',
                        'full_name',
                        'role',
                        'is_active',
                    ],
                    'token',
                ],
            ])
            ->assertJson([
                'message' => 'Login successful.',
                'data' => [
                    'administrator' => [
                        'id' => $admin->id,
                        'email' => 'admin@example.com',
                    ],
                ],
            ]);

        // Verify last_login_at was updated
        $admin->refresh();
        $this->assertNotNull($admin->last_login_at);
    }

    /**
     * Test admin login fails with invalid credentials.
     */
    public function test_admin_login_fails_with_invalid_credentials(): void
    {
        Administrator::factory()->create([
            'email' => 'admin@example.com',
            'password_hash' => Hash::make('SecurePassword123!'),
        ]);

        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'WrongPassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJson([
                'errors' => [
                    'email' => ['The provided credentials are incorrect.'],
                ],
            ]);
    }

    /**
     * Test admin login fails for inactive administrator.
     */
    public function test_admin_login_fails_for_inactive_administrator(): void
    {
        Administrator::factory()->create([
            'email' => 'inactive@example.com',
            'password_hash' => Hash::make('SecurePassword123!'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'SecurePassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJson([
                'errors' => [
                    'email' => ['Your administrator account has been deactivated. Please contact the system administrator.'],
                ],
            ]);
    }

    /**
     * Test admin login revokes existing tokens.
     */
    public function test_admin_login_revokes_existing_tokens(): void
    {
        $admin = Administrator::factory()->create([
            'email' => 'admin@example.com',
            'password_hash' => Hash::make('SecurePassword123!'),
            'is_active' => true,
        ]);

        // Create an existing token
        $oldToken = $admin->createToken('old-token')->plainTextToken;

        // Login to get new token
        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'SecurePassword123!',
        ]);

        $response->assertStatus(200);

        // Old token should be revoked
        $this->assertCount(1, $admin->tokens);
    }

    /**
     * Test authenticated admin can access their profile.
     */
    public function test_authenticated_admin_can_access_profile(): void
    {
        $admin = Administrator::factory()->superAdmin()->create([
            'email' => 'admin@example.com',
            'first_name' => 'John',
            'last_name' => 'Admin',
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'email',
                    'first_name',
                    'last_name',
                    'full_name',
                    'role',
                ],
            ])
            ->assertJson([
                'data' => [
                    'id' => $admin->id,
                    'email' => 'admin@example.com',
                    'first_name' => 'John',
                    'last_name' => 'Admin',
                    'role' => 'super_admin',
                ],
            ]);
    }

    /**
     * Test unauthenticated admin cannot access profile.
     */
    public function test_unauthenticated_admin_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * Test admin can update their profile.
     */
    public function test_admin_can_update_profile(): void
    {
        $admin = Administrator::factory()->create([
            'email' => 'admin@example.com',
            'first_name' => 'John',
            'last_name' => 'Admin',
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/admin/auth/profile', [
                'first_name' => 'Jane',
                'last_name' => 'Manager',
                'phone' => '+9876543210',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully.',
                'data' => [
                    'first_name' => 'Jane',
                    'last_name' => 'Manager',
                    'phone' => '+9876543210',
                ],
            ]);

        $this->assertDatabaseHas('administrators', [
            'id' => $admin->id,
            'first_name' => 'Jane',
            'last_name' => 'Manager',
            'phone' => '+9876543210',
        ]);
    }

    /**
     * Test admin can change password with valid current password.
     */
    public function test_admin_can_change_password_with_valid_current_password(): void
    {
        $admin = Administrator::factory()->create([
            'password_hash' => Hash::make('OldPassword123!'),
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/admin/auth/password', [
                'current_password' => 'OldPassword123!',
                'password' => 'NewSecurePassword123!',
                'password_confirmation' => 'NewSecurePassword123!',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Password changed successfully. Please login again.',
            ]);

        // Verify new password is set
        $admin->refresh();
        $this->assertTrue(Hash::check('NewSecurePassword123!', $admin->password_hash));
    }

    /**
     * Test password change revokes all tokens.
     */
    public function test_password_change_revokes_all_tokens(): void
    {
        $admin = Administrator::factory()->create([
            'password_hash' => Hash::make('OldPassword123!'),
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/admin/auth/password', [
                'current_password' => 'OldPassword123!',
                'password' => 'NewSecurePassword123!',
                'password_confirmation' => 'NewSecurePassword123!',
            ]);

        // Verify all tokens are deleted
        $this->assertCount(0, $admin->tokens);
    }

    /**
     * Test password change fails with incorrect current password.
     */
    public function test_password_change_fails_with_incorrect_current_password(): void
    {
        $admin = Administrator::factory()->create([
            'password_hash' => Hash::make('OldPassword123!'),
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/admin/auth/password', [
                'current_password' => 'WrongPassword123!',
                'password' => 'NewSecurePassword123!',
                'password_confirmation' => 'NewSecurePassword123!',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password'])
            ->assertJson([
                'errors' => [
                    'current_password' => ['The current password is incorrect.'],
                ],
            ]);
    }

    /**
     * Test admin can logout.
     */
    public function test_admin_can_logout(): void
    {
        $admin = Administrator::factory()->create();
        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully.',
            ]);

        // Verify token is deleted
        $this->assertCount(0, $admin->tokens);
    }

    /**
     * Test inactive admin cannot access protected routes.
     */
    public function test_inactive_admin_cannot_access_protected_routes(): void
    {
        $admin = Administrator::factory()->inactive()->create();
        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your administrator account has been deactivated. Please contact the system administrator.',
            ]);
    }

    /**
     * Test admin login without required fields fails.
     */
    public function test_admin_login_without_required_fields_fails(): void
    {
        $response = $this->postJson('/api/v1/admin/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    /**
     * Test admin full name is returned correctly.
     */
    public function test_admin_full_name_is_returned_correctly(): void
    {
        $admin = Administrator::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Admin',
        ]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'full_name' => 'John Admin',
                ],
            ]);
    }

    /**
     * Test invalid token is rejected.
     */
    public function test_invalid_token_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid-token-12345')
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * Test different admin roles can login.
     */
    public function test_different_admin_roles_can_login(): void
    {
        $roles = ['super_admin', 'admin', 'manager', 'staff', 'worker'];

        foreach ($roles as $role) {
            $admin = Administrator::factory()->create([
                'email' => "{$role}@example.com",
                'password_hash' => Hash::make('password'),
                'role' => $role,
                'is_active' => true,
            ]);

            $response = $this->postJson('/api/v1/admin/auth/login', [
                'email' => "{$role}@example.com",
                'password' => 'password',
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'data' => [
                        'administrator' => [
                            'role' => $role,
                        ],
                    ],
                ]);
        }
    }

    /**
     * Test admin registration endpoint does not exist.
     * Admin accounts can only be created by super_admin through management API.
     */
    public function test_admin_registration_endpoint_does_not_exist(): void
    {
        $response = $this->postJson('/api/v1/admin/auth/register', [
            'email' => 'newadmin@example.com',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
            'first_name' => 'New',
            'last_name' => 'Admin',
        ]);

        // Should return 404 (route not found) or 405 (method not allowed)
        $this->assertContains($response->status(), [404, 405]);
    }
}
