<?php

namespace Tests\Feature\AdminCatalog;

use App\Models\Administrator;
use App\Models\Attribute\Attribute;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttributeControllerTest extends TestCase
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

    public function test_admin_can_list_attributes(): void
    {
        Attribute::factory()->count(5)->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/admin/attributes');

        $response->assertStatus(200);
        $this->assertEquals(5, $response->json('meta.total'));
    }

    public function test_admin_can_create_attribute(): void
    {
        $data = [
            'name' => 'Color',
            'slug' => 'color',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/attributes', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('attributes', ['name' => 'Color']);
    }

    public function test_admin_can_view_attribute(): void
    {
        $attribute = Attribute::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/admin/attributes/{$attribute->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $attribute->id]);
    }

    public function test_admin_can_update_attribute(): void
    {
        $attribute = Attribute::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/admin/attributes/{$attribute->id}", [
                'name' => 'Updated Attribute',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('attributes', ['id' => $attribute->id, 'name' => 'Updated Attribute']);
    }

    public function test_admin_cannot_delete_attribute_with_values(): void
    {
        $attribute = Attribute::factory()->create();
        $attribute->values()->create(['value' => 'Red', 'position' => 0]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/admin/attributes/{$attribute->id}");

        $response->assertStatus(409);
    }

    public function test_admin_can_delete_attribute_without_values(): void
    {
        $attribute = Attribute::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/admin/attributes/{$attribute->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('attributes', ['id' => $attribute->id]);
    }
}
