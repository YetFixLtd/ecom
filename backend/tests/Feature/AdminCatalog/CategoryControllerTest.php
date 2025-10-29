<?php

namespace Tests\Feature\AdminCatalog;

use App\Models\Administrator;
use App\Models\Catalog\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryControllerTest extends TestCase
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

    public function test_admin_can_list_categories(): void
    {
        Category::factory()->count(5)->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/admin/categories');

        $response->assertStatus(200);
        $this->assertEquals(5, $response->json('meta.total'));
    }

    public function test_admin_can_create_category(): void
    {
        $data = [
            'name' => 'Electronics',
            'slug' => 'electronics',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/categories', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('categories', ['name' => 'Electronics']);
    }

    public function test_admin_can_view_category(): void
    {
        $category = Category::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/admin/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $category->id]);
    }

    public function test_admin_can_update_category(): void
    {
        $category = Category::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/admin/categories/{$category->id}", [
                'name' => 'Updated Category',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'Updated Category']);
    }

    public function test_admin_cannot_delete_category_with_children(): void
    {
        $parent = Category::factory()->create();
        Category::factory()->create(['parent_id' => $parent->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/admin/categories/{$parent->id}");

        $response->assertStatus(409);
    }

    public function test_admin_can_delete_category_without_children(): void
    {
        $category = Category::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/admin/categories/{$category->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }
}
