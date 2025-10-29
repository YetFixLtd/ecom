<?php

namespace Tests\Feature\AdminInventory;

use App\Models\Administrator;
use App\Models\Attribute\ProductVariant;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryMovement;
use App\Models\Inventory\Transfer;
use App\Models\Inventory\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransferControllerTest extends TestCase
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

    public function test_admin_can_create_transfer_draft(): void
    {
        $warehouseFrom = Warehouse::factory()->create();
        $warehouseTo = Warehouse::factory()->create();
        $variant = ProductVariant::factory()->create();

        $data = [
            'from_warehouse_id' => $warehouseFrom->id,
            'to_warehouse_id' => $warehouseTo->id,
            'items' => [
                ['variant_id' => $variant->id, 'qty' => 10],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/inventory/transfers', $data);

        $response->assertStatus(201)
            ->assertJsonFragment(['status' => 'draft']);

        $this->assertDatabaseHas('transfers', [
            'from_warehouse_id' => $warehouseFrom->id,
            'to_warehouse_id' => $warehouseTo->id,
            'status' => 'draft',
        ]);
    }

    public function test_admin_can_dispatch_transfer(): void
    {
        $warehouseFrom = Warehouse::factory()->create();
        $warehouseTo = Warehouse::factory()->create();
        $variant = ProductVariant::factory()->create();

        // Create inventory at source warehouse
        InventoryItem::factory()->create([
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouseFrom->id,
            'on_hand' => 100,
        ]);

        $transfer = Transfer::factory()->create([
            'from_warehouse_id' => $warehouseFrom->id,
            'to_warehouse_id' => $warehouseTo->id,
            'status' => 'draft',
        ]);

        \App\Models\Inventory\TransferItem::factory()->create([
            'transfer_id' => $transfer->id,
            'variant_id' => $variant->id,
            'qty' => 10,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/admin/inventory/transfers/{$transfer->id}/dispatch");

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'in_transit']);

        // Check source inventory reduced
        $sourceItem = InventoryItem::where('variant_id', $variant->id)
            ->where('warehouse_id', $warehouseFrom->id)
            ->first();

        $this->assertEquals(90, $sourceItem->on_hand); // 100 - 10

        // Check movement was created
        $this->assertDatabaseHas('inventory_movements', [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouseFrom->id,
            'movement_type' => 'transfer_out',
            'qty_change' => -10,
        ]);
    }

    public function test_admin_can_receive_transfer(): void
    {
        $warehouseFrom = Warehouse::factory()->create();
        $warehouseTo = Warehouse::factory()->create();
        $variant = ProductVariant::factory()->create();

        $transfer = Transfer::factory()->create([
            'from_warehouse_id' => $warehouseFrom->id,
            'to_warehouse_id' => $warehouseTo->id,
            'status' => 'in_transit',
        ]);

        \App\Models\Inventory\TransferItem::factory()->create([
            'transfer_id' => $transfer->id,
            'variant_id' => $variant->id,
            'qty' => 10,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/admin/inventory/transfers/{$transfer->id}/receive");

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'received']);

        // Check destination inventory increased
        $destItem = InventoryItem::where('variant_id', $variant->id)
            ->where('warehouse_id', $warehouseTo->id)
            ->first();

        $this->assertNotNull($destItem);
        $this->assertEquals(10, $destItem->on_hand);

        // Check movement was created
        $this->assertDatabaseHas('inventory_movements', [
            'variant_id' => $variant->id,
            'warehouse_id' => $warehouseTo->id,
            'movement_type' => 'transfer_in',
            'qty_change' => 10,
        ]);
    }

    public function test_admin_cannot_dispatch_without_stock(): void
    {
        $warehouseFrom = Warehouse::factory()->create();
        $warehouseTo = Warehouse::factory()->create();
        $variant = ProductVariant::factory()->create();

        $transfer = Transfer::factory()->create([
            'from_warehouse_id' => $warehouseFrom->id,
            'to_warehouse_id' => $warehouseTo->id,
            'status' => 'draft',
        ]);

        \App\Models\Inventory\TransferItem::factory()->create([
            'transfer_id' => $transfer->id,
            'variant_id' => $variant->id,
            'qty' => 10,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/admin/inventory/transfers/{$transfer->id}/dispatch");

        $response->assertStatus(422);
    }
}
