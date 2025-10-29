<?php

namespace Tests\Feature\AdminInventory;

use App\Models\Administrator;
use App\Models\Attribute\ProductVariant;
use App\Models\Inventory\InventoryAdjustment;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryMovement;
use App\Models\Inventory\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdjustmentControllerTest extends TestCase
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

    public function test_admin_can_adjust_stock_set_mode(): void
    {
        $warehouse = Warehouse::factory()->create();
        $variant = ProductVariant::factory()->create();

        InventoryItem::factory()->create([
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 50,
        ]);

        $data = [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'adjustment_mode' => 'SET_ON_HAND',
            'qty' => 100,
            'reason_code' => 'COUNT_CORRECTION',
            'note' => 'Cycle count adjustment',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/inventory/adjustments', $data);

        $response->assertStatus(201);

        // Check inventory item was updated
        $inventoryItem = InventoryItem::where('variant_id', $variant->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        $this->assertEquals(100, $inventoryItem->on_hand);

        // Check adjustment record was created
        $this->assertDatabaseHas('inventory_adjustments', [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'qty_before' => 50,
            'qty_after' => 100,
            'qty_change' => 50,
        ]);

        // Check movement record was created
        $this->assertDatabaseHas('inventory_movements', [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'movement_type' => 'adjustment',
            'qty_change' => 50,
        ]);
    }

    public function test_admin_can_adjust_stock_delta_mode(): void
    {
        $warehouse = Warehouse::factory()->create();
        $variant = ProductVariant::factory()->create();

        InventoryItem::factory()->create([
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 50,
        ]);

        $data = [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'adjustment_mode' => 'DELTA_ON_HAND',
            'qty' => 25,
            'reason_code' => 'FOUND_STOCK',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/inventory/adjustments', $data);

        $response->assertStatus(201);

        // Check inventory item was updated
        $inventoryItem = InventoryItem::where('variant_id', $variant->id)
            ->where('warehouse_id', $warehouse->id)
            ->first();

        $this->assertEquals(75, $inventoryItem->on_hand); // 50 + 25
    }

    public function test_adjustment_creates_inventory_item_if_not_exists(): void
    {
        $warehouse = Warehouse::factory()->create();
        $variant = ProductVariant::factory()->create();

        $data = [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'adjustment_mode' => 'SET_ON_HAND',
            'qty' => 100,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/inventory/adjustments', $data);

        $response->assertStatus(201);

        // Check inventory item was created with correct quantity
        $this->assertDatabaseHas('inventory_items', [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouse->id,
            'on_hand' => 100,
        ]);
    }
}
