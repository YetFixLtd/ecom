<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user can register with valid data.
     */
    public function test_user_can_register_with_valid_data(): void
    {
        $userData = [
            'email' => 'john@example.com',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '+1234567890',
        ];

        $response = $this->postJson('/api/v1/auth/register', $userData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'email',
                        'first_name',
                        'last_name',
                        'full_name',
                        'phone',
                        'is_active',
                        'email_verified_at',
                        'created_at',
                        'updated_at',
                    ],
                    'token',
                ],
            ])
            ->assertJson([
                'message' => 'User registered successfully.',
                'data' => [
                    'user' => [
                        'email' => 'john@example.com',
                        'first_name' => 'John',
                        'last_name' => 'Doe',
                        'phone' => '+1234567890',
                        'is_active' => true,
                    ],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        // Verify password is hashed
        $user = User::where('email', 'john@example.com')->first();
        $this->assertTrue(Hash::check('SecurePassword123!', $user->password_hash));
    }

    /**
     * Test registration fails without required fields.
     */
    public function test_registration_fails_without_required_fields(): void
    {
        $response = $this->postJson('/api/v1/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    /**
     * Test registration fails with invalid email.
     */
    public function test_registration_fails_with_invalid_email(): void
    {
        $userData = [
            'email' => 'not-an-email',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
        ];

        $response = $this->postJson('/api/v1/auth/register', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test registration fails with duplicate email.
     */
    public function test_registration_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $userData = [
            'email' => 'existing@example.com',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
        ];

        $response = $this->postJson('/api/v1/auth/register', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test registration fails when password confirmation doesn't match.
     */
    public function test_registration_fails_when_password_confirmation_does_not_match(): void
    {
        $userData = [
            'email' => 'john@example.com',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'DifferentPassword123!',
        ];

        $response = $this->postJson('/api/v1/auth/register', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test registration fails with short password.
     */
    public function test_registration_fails_with_short_password(): void
    {
        $userData = [
            'email' => 'john@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ];

        $response = $this->postJson('/api/v1/auth/register', $userData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test user can login with valid credentials.
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password_hash' => Hash::make('SecurePassword123!'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'john@example.com',
            'password' => 'SecurePassword123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'email',
                        'first_name',
                        'last_name',
                        'full_name',
                        'phone',
                        'is_active',
                    ],
                    'token',
                ],
            ])
            ->assertJson([
                'message' => 'Login successful.',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'email' => 'john@example.com',
                    ],
                ],
            ]);
    }

    /**
     * Test login fails with invalid credentials.
     */
    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
            'password_hash' => Hash::make('SecurePassword123!'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'john@example.com',
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
     * Test login fails with non-existent email.
     */
    public function test_login_fails_with_non_existent_email(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'SecurePassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test login fails for inactive user.
     */
    public function test_login_fails_for_inactive_user(): void
    {
        User::factory()->create([
            'email' => 'inactive@example.com',
            'password_hash' => Hash::make('SecurePassword123!'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'SecurePassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJson([
                'errors' => [
                    'email' => ['Your account has been deactivated. Please contact support.'],
                ],
            ]);
    }

    /**
     * Test login revokes existing tokens.
     */
    public function test_login_revokes_existing_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password_hash' => Hash::make('SecurePassword123!'),
            'is_active' => true,
        ]);

        // Create an existing token
        $oldToken = $user->createToken('old-token')->plainTextToken;

        // Login to get new token
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'john@example.com',
            'password' => 'SecurePassword123!',
        ]);

        $response->assertStatus(200);

        // Old token should be revoked
        $this->assertCount(1, $user->tokens);
    }

    /**
     * Test authenticated user can access their profile.
     */
    public function test_authenticated_user_can_access_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'email',
                    'first_name',
                    'last_name',
                    'full_name',
                ],
            ])
            ->assertJson([
                'data' => [
                    'id' => $user->id,
                    'email' => 'john@example.com',
                    'first_name' => 'John',
                    'last_name' => 'Doe',
                ],
            ]);
    }

    /**
     * Test unauthenticated user cannot access profile.
     */
    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * Test user can update their profile.
     */
    public function test_user_can_update_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/auth/profile', [
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'phone' => '+9876543210',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully.',
                'data' => [
                    'first_name' => 'Jane',
                    'last_name' => 'Smith',
                    'phone' => '+9876543210',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'phone' => '+9876543210',
        ]);
    }

    /**
     * Test user can update email.
     */
    public function test_user_can_update_email(): void
    {
        $user = User::factory()->create([
            'email' => 'old@example.com',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/auth/profile', [
                'email' => 'new@example.com',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully.',
                'data' => [
                    'email' => 'new@example.com',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'new@example.com',
        ]);
    }

    /**
     * Test profile update fails with duplicate email.
     */
    public function test_profile_update_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);
        $user = User::factory()->create(['email' => 'myemail@example.com']);

        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/auth/profile', [
                'email' => 'existing@example.com',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test user can change password with valid current password.
     */
    public function test_user_can_change_password_with_valid_current_password(): void
    {
        $user = User::factory()->create([
            'password_hash' => Hash::make('OldPassword123!'),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/auth/password', [
                'current_password' => 'OldPassword123!',
                'password' => 'NewSecurePassword123!',
                'password_confirmation' => 'NewSecurePassword123!',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Password changed successfully. Please login again.',
            ]);

        // Verify new password is set
        $user->refresh();
        $this->assertTrue(Hash::check('NewSecurePassword123!', $user->password_hash));
    }

    /**
     * Test password change revokes all tokens.
     */
    public function test_password_change_revokes_all_tokens(): void
    {
        $user = User::factory()->create([
            'password_hash' => Hash::make('OldPassword123!'),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/auth/password', [
                'current_password' => 'OldPassword123!',
                'password' => 'NewSecurePassword123!',
                'password_confirmation' => 'NewSecurePassword123!',
            ]);

        // Verify all tokens are deleted
        $this->assertCount(0, $user->tokens);
    }

    /**
     * Test password change fails with incorrect current password.
     */
    public function test_password_change_fails_with_incorrect_current_password(): void
    {
        $user = User::factory()->create([
            'password_hash' => Hash::make('OldPassword123!'),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/auth/password', [
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
     * Test password change fails when confirmation doesn't match.
     */
    public function test_password_change_fails_when_confirmation_does_not_match(): void
    {
        $user = User::factory()->create([
            'password_hash' => Hash::make('OldPassword123!'),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/auth/password', [
                'current_password' => 'OldPassword123!',
                'password' => 'NewSecurePassword123!',
                'password_confirmation' => 'DifferentPassword123!',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test user can logout.
     */
    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully.',
            ]);

        // Verify token is deleted
        $this->assertCount(0, $user->tokens);
    }

    /**
     * Test logout fails without authentication.
     */
    public function test_logout_fails_without_authentication(): void
    {
        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * Test logout only revokes current token, not all tokens.
     */
    public function test_logout_only_revokes_current_token(): void
    {
        $user = User::factory()->create();

        // Create two tokens
        $token1 = $user->createToken('token-1')->plainTextToken;
        $token2 = $user->createToken('token-2')->plainTextToken;

        $this->assertCount(2, $user->tokens);

        // Logout with token1
        $this->withHeader('Authorization', "Bearer {$token1}")
            ->postJson('/api/v1/auth/logout');

        // Verify only one token remains
        $user->refresh();
        $this->assertCount(1, $user->tokens);
    }

    /**
     * Test login without required fields fails.
     */
    public function test_login_without_required_fields_fails(): void
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    /**
     * Test protected routes require authentication.
     */
    public function test_protected_routes_require_authentication(): void
    {
        $routes = [
            ['method' => 'get', 'uri' => '/api/v1/auth/me'],
            ['method' => 'post', 'uri' => '/api/v1/auth/logout'],
            ['method' => 'put', 'uri' => '/api/v1/auth/profile'],
            ['method' => 'put', 'uri' => '/api/v1/auth/password'],
        ];

        foreach ($routes as $route) {
            $response = $this->{$route['method'] . 'Json'}($route['uri']);

            $response->assertStatus(401)
                ->assertJson([
                    'message' => 'Unauthenticated.',
                ]);
        }
    }

    /**
     * Test invalid token is rejected.
     */
    public function test_invalid_token_is_rejected(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid-token-12345')
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * Test user full name is returned correctly.
     */
    public function test_user_full_name_is_returned_correctly(): void
    {
        $user = User::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'full_name' => 'John Doe',
                ],
            ]);
    }

    /**
     * Test registration with optional fields omitted.
     */
    public function test_registration_with_optional_fields_omitted(): void
    {
        $userData = [
            'email' => 'minimal@example.com',
            'password' => 'SecurePassword123!',
            'password_confirmation' => 'SecurePassword123!',
        ];

        $response = $this->postJson('/api/v1/auth/register', $userData);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'User registered successfully.',
                'data' => [
                    'user' => [
                        'email' => 'minimal@example.com',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'minimal@example.com',
        ]);
    }

    /**
     * Test partial profile update only updates provided fields.
     */
    public function test_partial_profile_update_only_updates_provided_fields(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '+1234567890',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        // Update only first name
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/auth/profile', [
                'first_name' => 'Jane',
            ]);

        $response->assertStatus(200);

        $user->refresh();

        // Verify only first_name changed
        $this->assertEquals('Jane', $user->first_name);
        $this->assertEquals('Doe', $user->last_name); // Unchanged
        $this->assertEquals('+1234567890', $user->phone); // Unchanged
    }
}
