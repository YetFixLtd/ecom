<?php

namespace Tests\Feature\AdminCatalog;

use App\Models\Administrator;
use App\Models\Catalog\Brand;
use App\Models\Catalog\Category;
use App\Models\Catalog\Product;
use App\Models\Attribute\Attribute;
use App\Models\Attribute\AttributeValue;
use App\Models\Attribute\ProductVariant;
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
}
