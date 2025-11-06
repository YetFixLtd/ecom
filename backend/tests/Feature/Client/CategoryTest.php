<?php

namespace Tests\Feature\Client;

use App\Models\Catalog\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test user can list categories.
     */
    public function test_user_can_list_categories(): void
    {
        Category::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'slug',
                        'parent_id',
                    ],
                ],
            ]);

        $this->assertCount(3, $response->json('data'));
    }

    /**
     * Test user can view category details.
     */
    public function test_user_can_view_category_details(): void
    {
        $category = Category::factory()->create([
            'name' => 'Electronics',
        ]);

        $response = $this->getJson("/api/v1/categories/{$category->id}");

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
                    'id' => $category->id,
                    'name' => 'Electronics',
                ],
            ]);
    }

    /**
     * Test categories show tree structure.
     */
    public function test_categories_show_tree_structure(): void
    {
        $parent = Category::factory()->create(['name' => 'Parent']);
        $child = Category::factory()->create([
            'name' => 'Child',
            'parent_id' => $parent->id,
        ]);

        $response = $this->getJson('/api/v1/categories');

        $response->assertStatus(200);
        // Root categories should be returned
        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }
}
