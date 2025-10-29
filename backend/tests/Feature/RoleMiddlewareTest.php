<?php

namespace Tests\Feature;

use App\Models\Administrator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test super_admin has access to all routes.
     */
    public function test_super_admin_has_access_to_all_routes(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        // Super admin should access management routes
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators');

        $response->assertStatus(200);
    }

    /**
     * Test admin cannot access super_admin routes.
     */
    public function test_admin_cannot_access_super_admin_routes(): void
    {
        $admin = Administrator::factory()->admin()->create();
        $token = $admin->createToken('admin-token')->plainTextToken;

        // Admin should not access management routes
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators');

        $response->assertStatus(403);
    }

    /**
     * Test manager cannot access super_admin routes.
     */
    public function test_manager_cannot_access_super_admin_routes(): void
    {
        $manager = Administrator::factory()->manager()->create();
        $token = $manager->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators');

        $response->assertStatus(403);
    }

    /**
     * Test staff cannot access super_admin routes.
     */
    public function test_staff_cannot_access_super_admin_routes(): void
    {
        $staff = Administrator::factory()->staff()->create();
        $token = $staff->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators');

        $response->assertStatus(403);
    }

    /**
     * Test worker cannot access super_admin routes.
     */
    public function test_worker_cannot_access_super_admin_routes(): void
    {
        $worker = Administrator::factory()->worker()->create();
        $token = $worker->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators');

        $response->assertStatus(403);
    }

    /**
     * Test super_admin can access their own profile.
     */
    public function test_super_admin_can_access_their_own_profile(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $token = $superAdmin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(200);
        $this->assertEquals('super_admin', $response->json('data.role'));
    }

    /**
     * Test admin can access their own profile.
     */
    public function test_admin_can_access_their_own_profile(): void
    {
        $admin = Administrator::factory()->admin()->create();
        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(200);
        $this->assertEquals('admin', $response->json('data.role'));
    }

    /**
     * Test manager can access their own profile.
     */
    public function test_manager_can_access_their_own_profile(): void
    {
        $manager = Administrator::factory()->manager()->create();
        $token = $manager->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(200);
        $this->assertEquals('manager', $response->json('data.role'));
    }

    /**
     * Test staff can access their own profile.
     */
    public function test_staff_can_access_their_own_profile(): void
    {
        $staff = Administrator::factory()->staff()->create();
        $token = $staff->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(200);
        $this->assertEquals('staff', $response->json('data.role'));
    }

    /**
     * Test worker can access their own profile.
     */
    public function test_worker_can_access_their_own_profile(): void
    {
        $worker = Administrator::factory()->worker()->create();
        $token = $worker->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(200);
        $this->assertEquals('worker', $response->json('data.role'));
    }

    /**
     * Test all roles can update their own profile.
     */
    public function test_all_roles_can_update_their_own_profile(): void
    {
        $factoryStates = ['superAdmin', 'admin', 'manager', 'staff', 'worker'];

        foreach ($factoryStates as $state) {
            $admin = Administrator::factory()->{$state}()->create();
            $token = $admin->createToken('admin-token')->plainTextToken;

            $response = $this->withHeader('Authorization', "Bearer {$token}")
                ->putJson('/api/v1/admin/auth/profile', [
                    'first_name' => 'Updated',
                ]);

            $response->assertStatus(200);
        }
    }

    /**
     * Test all roles can change their own password.
     */
    public function test_all_roles_can_change_their_own_password(): void
    {
        $admin = Administrator::factory()->manager()->create([
            'password_hash' => \Illuminate\Support\Facades\Hash::make('OldPassword123!'),
        ]);
        $token = $admin->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/v1/admin/auth/password', [
                'current_password' => 'OldPassword123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ]);

        $response->assertStatus(200);
    }

    /**
     * Test inactive administrator cannot access any routes.
     */
    public function test_inactive_administrator_cannot_access_any_routes(): void
    {
        $admin = Administrator::factory()->superAdmin()->inactive()->create();
        $token = $admin->createToken('admin-token')->plainTextToken;

        // Try accessing profile
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/auth/me');

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Your administrator account has been deactivated. Please contact the system administrator.',
            ]);

        // Try accessing management routes
        $response2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators');

        $response2->assertStatus(403);
    }

    /**
     * Test unauthenticated requests are rejected.
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $routes = [
            ['method' => 'get', 'uri' => '/api/v1/admin/auth/me'],
            ['method' => 'post', 'uri' => '/api/v1/admin/auth/logout'],
            ['method' => 'put', 'uri' => '/api/v1/admin/auth/profile'],
            ['method' => 'put', 'uri' => '/api/v1/admin/auth/password'],
            ['method' => 'get', 'uri' => '/api/v1/admin/administrators'],
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
     * Test hasRole helper method works correctly.
     */
    public function test_has_role_helper_method_works_correctly(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $admin = Administrator::factory()->admin()->create();
        $manager = Administrator::factory()->manager()->create();

        $this->assertTrue($superAdmin->hasRole('super_admin'));
        $this->assertFalse($superAdmin->hasRole('admin'));

        $this->assertTrue($admin->hasRole('admin'));
        $this->assertTrue($admin->hasRole('admin', 'manager'));
        $this->assertFalse($admin->hasRole('super_admin'));

        $this->assertTrue($manager->hasRole('manager', 'admin'));
        $this->assertFalse($manager->hasRole('super_admin', 'admin'));
    }

    /**
     * Test isSuperAdmin helper method.
     */
    public function test_is_super_admin_helper_method(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $admin = Administrator::factory()->admin()->create();

        $this->assertTrue($superAdmin->isSuperAdmin());
        $this->assertFalse($admin->isSuperAdmin());
    }

    /**
     * Test isAdmin helper method.
     */
    public function test_is_admin_helper_method(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $admin = Administrator::factory()->admin()->create();
        $manager = Administrator::factory()->manager()->create();

        $this->assertTrue($superAdmin->isAdmin());
        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($manager->isAdmin());
    }

    /**
     * Test isManager helper method.
     */
    public function test_is_manager_helper_method(): void
    {
        $superAdmin = Administrator::factory()->superAdmin()->create();
        $admin = Administrator::factory()->admin()->create();
        $manager = Administrator::factory()->manager()->create();
        $staff = Administrator::factory()->staff()->create();

        $this->assertTrue($superAdmin->isManager());
        $this->assertTrue($admin->isManager());
        $this->assertTrue($manager->isManager());
        $this->assertFalse($staff->isManager());
    }

    /**
     * Test middleware returns proper error message for unauthorized access.
     */
    public function test_middleware_returns_proper_error_message_for_unauthorized_access(): void
    {
        $staff = Administrator::factory()->staff()->create();
        $token = $staff->createToken('admin-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/administrators');

        $response->assertStatus(403)
            ->assertJsonStructure(['message']);

        $this->assertStringContainsString('This action is unauthorized', $response->json('message'));
    }
}
