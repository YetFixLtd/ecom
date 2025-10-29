<?php

namespace Tests\Feature\AdminCatalog;

use App\Models\Administrator;
use App\Models\Catalog\Brand;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrandControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Administrator $admin;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Administrator::factory()->admin()->create();
        $this->token = $this->admin->createToken('admin-token')->plainTextToken;
    }

    public function test_admin_can_list_brands(): void
    {
        Brand::factory()->count(5)->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/admin/brands');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug', 'website_url', 'logo_url'],
                ],
            ]);

        $this->assertEquals(5, $response->json('meta.total'));
    }

    public function test_admin_can_create_brand(): void
    {
        $data = [
            'name' => 'Nike',
            'slug' => 'nike',
            'website_url' => 'https://nike.com',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/brands', $data);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'Nike']);

        $this->assertDatabaseHas('brands', ['name' => 'Nike']);
    }

    public function test_admin_can_view_brand(): void
    {
        $brand = Brand::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/admin/brands/{$brand->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $brand->id, 'name' => $brand->name]);
    }

    public function test_admin_can_update_brand(): void
    {
        $brand = Brand::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/admin/brands/{$brand->id}", [
                'name' => 'Updated Brand',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'Updated Brand']);

        $this->assertDatabaseHas('brands', ['id' => $brand->id, 'name' => 'Updated Brand']);
    }

    public function test_admin_can_delete_brand(): void
    {
        $brand = Brand::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/admin/brands/{$brand->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('brands', ['id' => $brand->id]);
    }

    public function test_unauthorized_user_cannot_access_brands(): void
    {
        $response = $this->getJson('/api/v1/admin/brands');
        $response->assertStatus(401);
    }
}
