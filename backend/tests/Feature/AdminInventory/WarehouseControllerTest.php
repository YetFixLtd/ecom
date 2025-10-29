<?php

namespace Tests\Feature\AdminInventory;

use App\Models\Administrator;
use App\Models\Inventory\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarehouseControllerTest extends TestCase
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

    public function test_admin_can_list_warehouses(): void
    {
        Warehouse::factory()->count(5)->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/admin/inventory/warehouses');

        $response->assertStatus(200);
        $this->assertEquals(5, $response->json('meta.total'));
    }

    public function test_admin_can_create_warehouse(): void
    {
        $data = [
            'name' => 'Main Warehouse',
            'code' => 'MAIN-001',
            'city' => 'Dhaka',
            'country_code' => 'BD',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/inventory/warehouses', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('warehouses', ['name' => 'Main Warehouse', 'code' => 'MAIN-001']);
    }

    public function test_warehouse_can_be_set_as_default(): void
    {
        Warehouse::factory()->create(['is_default' => true]);

        $data = [
            'name' => 'New Default Warehouse',
            'code' => 'DEFAULT-001',
            'is_default' => true,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/inventory/warehouses', $data);

        $response->assertStatus(201);

        // Check that only the new warehouse is default
        $this->assertEquals(1, Warehouse::where('is_default', true)->count());
        $this->assertTrue(Warehouse::where('code', 'DEFAULT-001')->first()->is_default);
    }

    public function test_admin_can_view_warehouse(): void
    {
        $warehouse = Warehouse::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/admin/inventory/warehouses/{$warehouse->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $warehouse->id]);
    }

    public function test_admin_can_update_warehouse(): void
    {
        $warehouse = Warehouse::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/admin/inventory/warehouses/{$warehouse->id}", [
                'name' => 'Updated Warehouse',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('warehouses', ['id' => $warehouse->id, 'name' => 'Updated Warehouse']);
    }

    public function test_admin_cannot_delete_warehouse_with_inventory(): void
    {
        $warehouse = Warehouse::factory()->create();
        \App\Models\Inventory\InventoryItem::factory()->create(['warehouse_id' => $warehouse->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/admin/inventory/warehouses/{$warehouse->id}");

        $response->assertStatus(409);
    }

    public function test_admin_can_delete_warehouse_without_inventory(): void
    {
        $warehouse = Warehouse::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/admin/inventory/warehouses/{$warehouse->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('warehouses', ['id' => $warehouse->id]);
    }
}
