<?php

namespace Tests\Feature\Client;

use App\Models\Catalog\Product;
use App\Models\Catalog\Brand;
use App\Models\Catalog\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user can list published products.
     */
    public function test_user_can_list_published_products(): void
    {
        // Create published products
        Product::factory()->count(3)->create([
            'published_status' => 'published',
            'is_active' => true,
        ]);

        // Create draft products (should not appear)
        Product::factory()->count(2)->create([
            'published_status' => 'draft',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'primary_image',
                        'min_price',
                        'max_price',
                    ],
                ],
                'meta',
            ]);

        // Should only return published products
        $this->assertCount(3, $response->json('data'));
    }

    /**
     * Test user can filter products by category.
     */
    public function test_user_can_filter_products_by_category(): void
    {
        $category = Category::factory()->create();
        $otherCategory = Category::factory()->create();

        $product1 = Product::factory()->create([
            'published_status' => 'published',
            'is_active' => true,
        ]);
        $product1->categories()->attach($category->id);

        $product2 = Product::factory()->create([
            'published_status' => 'published',
            'is_active' => true,
        ]);
        $product2->categories()->attach($otherCategory->id);

        $response = $this->getJson("/api/v1/products?category={$category->id}");

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($product1->id, $response->json('data.0.id'));
    }

    /**
     * Test user can filter products by brand.
     */
    public function test_user_can_filter_products_by_brand(): void
    {
        $brand = Brand::factory()->create();
        $otherBrand = Brand::factory()->create();

        Product::factory()->create([
            'brand_id' => $brand->id,
            'published_status' => 'published',
            'is_active' => true,
        ]);

        Product::factory()->create([
            'brand_id' => $otherBrand->id,
            'published_status' => 'published',
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/products?brand={$brand->id}");

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    /**
     * Test user can search products.
     */
    public function test_user_can_search_products(): void
    {
        Product::factory()->create([
            'name' => 'Test Product',
            'published_status' => 'published',
            'is_active' => true,
        ]);

        Product::factory()->create([
            'name' => 'Other Product',
            'published_status' => 'published',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/products?search=Test');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertStringContainsString('Test', $response->json('data.0.name'));
    }

    /**
     * Test user can view product details.
     */
    public function test_user_can_view_product_details(): void
    {
        $product = Product::factory()->create([
            'published_status' => 'published',
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'description',
                    'brand',
                    'categories',
                    'variants',
                ],
            ])
            ->assertJson([
                'data' => [
                    'id' => $product->id,
                    'name' => $product->name,
                ],
            ]);
    }

    /**
     * Test user cannot view unpublished product.
     */
    public function test_user_cannot_view_unpublished_product(): void
    {
        $product = Product::factory()->create([
            'published_status' => 'draft',
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/products/{$product->id}");

        $response->assertStatus(404);
    }

    /**
     * Test user can view product variants.
     */
    public function test_user_can_view_product_variants(): void
    {
        $product = Product::factory()->create([
            'published_status' => 'published',
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/v1/products/{$product->id}/variants");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'sku',
                        'price',
                    ],
                ],
            ]);
    }
}
