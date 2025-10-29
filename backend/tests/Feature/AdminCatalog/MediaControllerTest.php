<?php

namespace Tests\Feature\AdminCatalog;

use App\Models\Administrator;
use App\Models\Catalog\Product;
use App\Models\Catalog\ProductImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MediaControllerTest extends TestCase
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

    public function test_admin_can_add_image_to_product(): void
    {
        $product = Product::factory()->create();

        $data = [
            'url' => 'https://example.com/image.jpg',
            'alt_text' => 'Product Image',
            'is_primary' => true,
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->postJson("/api/v1/admin/products/{$product->id}/images", $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('product_images', [
            'product_id' => $product->id,
            'url' => 'https://example.com/image.jpg',
        ]);
    }

    public function test_admin_can_list_product_images(): void
    {
        $product = Product::factory()->create();
        ProductImage::factory()->count(3)->create(['product_id' => $product->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->getJson("/api/v1/admin/products/{$product->id}/images");

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_admin_can_delete_product_image(): void
    {
        $product = Product::factory()->create();
        $image = ProductImage::factory()->create(['product_id' => $product->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->token}")
            ->deleteJson("/api/v1/admin/products/{$product->id}/images/{$image->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('product_images', ['id' => $image->id]);
    }
}
