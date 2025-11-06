<?php

namespace Tests\Feature\Client;

use App\Models\Catalog\Brand;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrandTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user can list brands.
     */
    public function test_user_can_list_brands(): void
    {
        Brand::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/brands');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                    ],
                ],
            ]);

        $this->assertCount(3, $response->json('data'));
    }

    /**
     * Test user can view brand details.
     */
    public function test_user_can_view_brand_details(): void
    {
        $brand = Brand::factory()->create([
            'name' => 'Test Brand',
        ]);

        $response = $this->getJson("/api/v1/brands/{$brand->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'slug',
                    'products_count',
                ],
            ])
            ->assertJson([
                'data' => [
                    'id' => $brand->id,
                    'name' => 'Test Brand',
                ],
            ]);
    }

    /**
     * Test user can search brands.
     */
    public function test_user_can_search_brands(): void
    {
        Brand::factory()->create(['name' => 'Test Brand']);
        Brand::factory()->create(['name' => 'Other Brand']);

        $response = $this->getJson('/api/v1/brands?search=Test');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }
}
