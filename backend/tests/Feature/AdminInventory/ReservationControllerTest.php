<?php

namespace Tests\Feature\AdminInventory;

use App\Models\Administrator;
use App\Models\Attribute\ProductVariant;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryMovement;
use App\Models\Inventory\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationControllerTest extends TestCase
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

    public function test_admin_can_reserve_stock(): void
    {
        $warehouse = Warehouse::factory()->create();
        $variant = ProductVariant::factory()->create();

        InventoryItem::factory()->create([
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
            'reserved' => 0,
        ]);

        $data = [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'qty' => 20,
            'reference_type' => 'order',
            'reference_id' => 123,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/inventory/reserve', $data);

        $response->assertStatus(200);

        // Check reserved increased
        $inventoryItem = InventoryItem::where('variant_id', $variant->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        $this->assertEquals(20, $inventoryItem->reserved);
        $this->assertEquals(100, $inventoryItem->on_hand); // on_hand unchanged
        $this->assertEquals(80, $inventoryItem->available); // 100 - 20

        // Check movement was created
        $this->assertDatabaseHas('inventory_movements', [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'movement_type' => 'reservation',
            'qty_change' => 0,
            'reference_type' => 'order',
            'reference_id' => 123,
        ]);
    }

    public function test_admin_cannot_reserve_more_than_available(): void
    {
        $warehouse = Warehouse::factory()->create();
        $variant = ProductVariant::factory()->create();

        InventoryItem::factory()->create([
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
            'reserved' => 90, // Already reserved
        ]);

        $data = [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'qty' => 20, // Only 10 available (100 - 90)
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/inventory/reserve', $data);

        $response->assertStatus(422);
    }

    public function test_admin_can_release_reserved_stock(): void
    {
        $warehouse = Warehouse::factory()->create();
        $variant = ProductVariant::factory()->create();

        InventoryItem::factory()->create([
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
            'reserved' => 20,
        ]);

        $data = [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'qty' => 15,
            'reference_type' => 'order',
            'reference_id' => 123,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/inventory/release', $data);

        $response->assertStatus(200);

        // Check reserved decreased
        $inventoryItem = InventoryItem::where('variant_id', $variant->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        $this->assertEquals(5, $inventoryItem->reserved); // 20 - 15

        // Check movement was created
        $this->assertDatabaseHas('inventory_movements', [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'movement_type' => 'release',
            'qty_change' => 0,
        ]);
    }
}
