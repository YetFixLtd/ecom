<?php

namespace Tests\Feature\AdminCatalog;

use App\Models\Administrator;
use App\Models\Catalog\Brand;
use App\Models\Catalog\Category;
use App\Models\Catalog\Product;
use App\Models\Attribute\Attribute;
use App\Models\Attribute\AttributeValue;
use App\Models\Attribute\ProductVariant;
use App\Models\Inventory\InventoryItem;
use App\Models\Inventory\InventoryMovement;
use App\Models\Inventory\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Administrator $admin;
    protected string $token;
    protected Attribute $colorAttribute;
    protected Attribute $sizeAttribute;
    protected AttributeValue $redValue;
    protected AttributeValue $largeValue;
    protected Warehouse $warehouse;
    protected Warehouse $warehouse2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Administrator::factory()->admin()->create();
        $this->token = $this->admin->createToken('admin-token')->plainTextToken;

        // Create attributes and values for variants
        $this->colorAttribute = Attribute::factory()->create(['name' => 'Color', 'slug' => 'color']);
        $this->sizeAttribute = Attribute::factory()->create(['name' => 'Size', 'slug' => 'size']);
        $this->redValue = AttributeValue::factory()->create(['attribute_id' => $this->colorAttribute->id, 'value' => 'Red']);
        $this->largeValue = AttributeValue::factory()->create(['attribute_id' => $this->sizeAttribute->id, 'value' => 'Large']);

        // Create warehouses for inventory tests
        $this->warehouse = Warehouse::factory()->create();
        $this->warehouse2 = Warehouse::factory()->create();
    }

    public function test_admin_can_list_products(): void
    {
        Product::factory()->count(5)->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson('/api/v1/admin/products');

        $response->assertStatus(200);
        $this->assertEquals(5, $response->json('meta.total'));
    }

    public function test_admin_can_create_product_with_variants(): void
    {
        $brand = Brand::factory()->create();
        $category = Category::factory()->create();

        $data = [
            'name' => 'Test Product',
            'slug' => 'test-product',
            'product_type' => 'variant',
            'brand_id' => $brand->id,
            'categories' => [$category->id],
            'variants' => [
                [
                    'sku' => 'TEST-RED-L',
                    'price' => 29.99,
                    'attribute_values' => [
                        ['attribute_id' => $this->colorAttribute->id, 'attribute_value_id' => $this->redValue->id],
                        ['attribute_id' => $this->sizeAttribute->id, 'attribute_value_id' => $this->largeValue->id],
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/products', $data);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'Test Product']);

        $this->assertDatabaseHas('products', ['name' => 'Test Product']);
        $product = Product::where('name', 'Test Product')->first();
        $this->assertEquals(1, $product->variants()->count());
        $this->assertEquals(1, $product->categories()->count());
    }

    public function test_admin_can_view_product(): void
    {
        $product = Product::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/admin/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $product->id]);
    }

    public function test_admin_can_update_product(): void
    {
        $product = Product::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/admin/products/{$product->id}", [
                'name' => 'Updated Product',
                'product_type' => $product->product_type,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'name' => 'Updated Product']);
    }

    public function test_admin_can_delete_product(): void
    {
        $product = Product::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/admin/products/{$product->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_product_creation_validates_variant_attributes(): void
    {
        $data = [
            'name' => 'Test Product',
            'product_type' => 'variant',
            'variants' => [
                [
                    'sku' => 'TEST-1',
                    'price' => 29.99,
                    'attribute_values' => [
                        ['attribute_id' => 999, 'attribute_value_id' => $this->redValue->id], // Invalid attribute_id
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/products', $data);

        $response->assertStatus(422);
    }

    public function test_admin_can_create_product_with_inventory(): void
    {
        $brand = Brand::factory()->create();
        $category = Category::factory()->create();

        $data = [
            'name' => 'Test Product with Inventory',
            'slug' => 'test-product-inventory',
            'product_type' => 'variant',
            'brand_id' => $brand->id,
            'categories' => [$category->id],
            'variants' => [
                [
                    'sku' => 'TEST-INV-001',
                    'price' => 29.99,
                    'track_stock' => true,
                    'attribute_values' => [
                        ['attribute_id' => $this->colorAttribute->id, 'attribute_value_id' => $this->redValue->id],
                        ['attribute_id' => $this->sizeAttribute->id, 'attribute_value_id' => $this->largeValue->id],
                    ],
                    'inventory' => [
                        [
                            'warehouse_id' => $this->warehouse->id,
                            'on_hand' => 100,
                            'safety_stock' => 10,
                            'reorder_point' => 20,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/products', $data);

        $response->assertStatus(201);

        $product = Product::where('name', 'Test Product with Inventory')->first();
        $variant = $product->variants()->first();

        // Verify inventory item was created
        $inventoryItem = InventoryItem::where('variant_id', $variant->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();

        $this->assertNotNull($inventoryItem);
        $this->assertEquals(100, $inventoryItem->on_hand);
        $this->assertEquals(10, $inventoryItem->safety_stock);
        $this->assertEquals(20, $inventoryItem->reorder_point);
        $this->assertEquals(0, $inventoryItem->reserved);

        // Verify movement record was created
        $movement = InventoryMovement::where('variant_id', $variant->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals(100, $movement->qty_change);
        $this->assertEquals('adjustment', $movement->movement_type);
        $this->assertEquals('product_creation', $movement->reference_type);
        $this->assertEquals($product->id, $movement->reference_id);
    }

    public function test_admin_can_create_product_with_inventory_multiple_warehouses(): void
    {
        $brand = Brand::factory()->create();
        $category = Category::factory()->create();

        $data = [
            'name' => 'Test Product Multi Warehouse',
            'slug' => 'test-product-multi-wh',
            'product_type' => 'variant',
            'brand_id' => $brand->id,
            'categories' => [$category->id],
            'variants' => [
                [
                    'sku' => 'TEST-MULTI-001',
                    'price' => 49.99,
                    'track_stock' => true,
                    'attribute_values' => [
                        ['attribute_id' => $this->colorAttribute->id, 'attribute_value_id' => $this->redValue->id],
                        ['attribute_id' => $this->sizeAttribute->id, 'attribute_value_id' => $this->largeValue->id],
                    ],
                    'inventory' => [
                        [
                            'warehouse_id' => $this->warehouse->id,
                            'on_hand' => 100,
                            'safety_stock' => 10,
                        ],
                        [
                            'warehouse_id' => $this->warehouse2->id,
                            'on_hand' => 50,
                            'reorder_point' => 15,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/products', $data);

        $response->assertStatus(201);

        $product = Product::where('name', 'Test Product Multi Warehouse')->first();
        $variant = $product->variants()->first();

        // Verify inventory items for both warehouses
        $this->assertEquals(2, InventoryItem::where('variant_id', $variant->id)->count());

        $item1 = InventoryItem::where('variant_id', $variant->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();
        $this->assertEquals(100, $item1->on_hand);

        $item2 = InventoryItem::where('variant_id', $variant->id)
            ->where('warehouse_id', $this->warehouse2->id)
            ->first();
        $this->assertEquals(50, $item2->on_hand);
    }

    public function test_product_creation_without_inventory_still_works(): void
    {
        $brand = Brand::factory()->create();
        $category = Category::factory()->create();

        $data = [
            'name' => 'Test Product No Inventory',
            'slug' => 'test-product-no-inv',
            'product_type' => 'variant',
            'brand_id' => $brand->id,
            'categories' => [$category->id],
            'variants' => [
                [
                    'sku' => 'TEST-NO-INV',
                    'price' => 19.99,
                    'track_stock' => true,
                    'attribute_values' => [
                        ['attribute_id' => $this->colorAttribute->id, 'attribute_value_id' => $this->redValue->id],
                        ['attribute_id' => $this->sizeAttribute->id, 'attribute_value_id' => $this->largeValue->id],
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/products', $data);

        $response->assertStatus(201);

        $product = Product::where('name', 'Test Product No Inventory')->first();
        $variant = $product->variants()->first();

        // Verify no inventory items created
        $this->assertEquals(0, InventoryItem::where('variant_id', $variant->id)->count());
    }

    public function test_product_creation_skips_inventory_when_track_stock_false(): void
    {
        $brand = Brand::factory()->create();
        $category = Category::factory()->create();

        $data = [
            'name' => 'Test Product No Track Stock',
            'slug' => 'test-product-no-track',
            'product_type' => 'variant',
            'brand_id' => $brand->id,
            'categories' => [$category->id],
            'variants' => [
                [
                    'sku' => 'TEST-NO-TRACK',
                    'price' => 39.99,
                    'track_stock' => false,
                    'attribute_values' => [
                        ['attribute_id' => $this->colorAttribute->id, 'attribute_value_id' => $this->redValue->id],
                        ['attribute_id' => $this->sizeAttribute->id, 'attribute_value_id' => $this->largeValue->id],
                    ],
                    'inventory' => [
                        [
                            'warehouse_id' => $this->warehouse->id,
                            'on_hand' => 100,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/products', $data);

        $response->assertStatus(201);

        $product = Product::where('name', 'Test Product No Track Stock')->first();
        $variant = $product->variants()->first();

        // Verify inventory was NOT created (track_stock is false)
        $this->assertEquals(0, InventoryItem::where('variant_id', $variant->id)->count());
        $this->assertEquals(0, InventoryMovement::where('variant_id', $variant->id)->count());
    }

    public function test_admin_can_update_product_with_new_variant_inventory(): void
    {
        $product = Product::factory()->create(['product_type' => 'variant']);
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'EXISTING-VARIANT',
        ]);

        $data = [
            'name' => $product->name,
            'product_type' => $product->product_type,
            'variants' => [
                [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'price' => $variant->price,
                    'attribute_values' => [
                        ['attribute_id' => $this->colorAttribute->id, 'attribute_value_id' => $this->redValue->id],
                    ],
                ],
                [
                    'sku' => 'NEW-VARIANT-WITH-INV',
                    'price' => 59.99,
                    'track_stock' => true,
                    'attribute_values' => [
                        ['attribute_id' => $this->colorAttribute->id, 'attribute_value_id' => $this->redValue->id],
                    ],
                    'inventory' => [
                        [
                            'warehouse_id' => $this->warehouse->id,
                            'on_hand' => 75,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->putJson("/api/v1/admin/products/{$product->id}", $data);

        $response->assertStatus(200);

        // Verify new variant has inventory
        $newVariant = ProductVariant::where('sku', 'NEW-VARIANT-WITH-INV')->first();
        $this->assertNotNull($newVariant);

        $inventoryItem = InventoryItem::where('variant_id', $newVariant->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();

        $this->assertNotNull($inventoryItem);
        $this->assertEquals(75, $inventoryItem->on_hand);

        // Verify existing variant does NOT have inventory (we didn't provide it)
        $this->assertEquals(0, InventoryItem::where('variant_id', $variant->id)->count());
    }

    public function test_inventory_movement_created_on_product_creation(): void
    {
        $brand = Brand::factory()->create();

        $data = [
            'name' => 'Test Movement Record',
            'slug' => 'test-movement',
            'product_type' => 'variant',
            'brand_id' => $brand->id,
            'variants' => [
                [
                    'sku' => 'TEST-MOVEMENT',
                    'price' => 99.99,
                    'track_stock' => true,
                    'attribute_values' => [
                        ['attribute_id' => $this->colorAttribute->id, 'attribute_value_id' => $this->redValue->id],
                    ],
                    'inventory' => [
                        [
                            'warehouse_id' => $this->warehouse->id,
                            'on_hand' => 200,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson('/api/v1/admin/products', $data);

        $response->assertStatus(201);

        $product = Product::where('name', 'Test Movement Record')->first();
        $variant = $product->variants()->first();

        $movement = InventoryMovement::where('variant_id', $variant->id)
            ->where('reference_type', 'product_creation')
            ->where('reference_id', $product->id)
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals(200, $movement->qty_change);
        $this->assertEquals('adjustment', $movement->movement_type);
        $this->assertEquals($this->admin->id, $movement->performed_by);
    }
}
