<?php

namespace Database\Seeders;

use App\Models\Catalog\Brand;
use App\Models\Catalog\Category;
use App\Models\Catalog\Product;
use App\Models\Attribute\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create brands
        $brands = [
            ['name' => 'TechCorp', 'slug' => 'techcorp'],
            ['name' => 'FashionHub', 'slug' => 'fashionhub'],
            ['name' => 'HomeEssentials', 'slug' => 'homeessentials'],
            ['name' => 'SportsPro', 'slug' => 'sportspro'],
            ['name' => 'BeautyPlus', 'slug' => 'beautyplus'],
        ];

        $createdBrands = [];
        foreach ($brands as $brandData) {
            $createdBrands[] = Brand::firstOrCreate(
                ['slug' => $brandData['slug']],
                $brandData
            );
        }

        // Create categories
        $categories = [
            ['name' => 'Electronics', 'slug' => 'electronics', 'parent_id' => null],
            ['name' => 'Clothing', 'slug' => 'clothing', 'parent_id' => null],
            ['name' => 'Home & Living', 'slug' => 'home-living', 'parent_id' => null],
            ['name' => 'Sports & Outdoors', 'slug' => 'sports-outdoors', 'parent_id' => null],
            ['name' => 'Beauty & Personal Care', 'slug' => 'beauty-personal-care', 'parent_id' => null],
            ['name' => 'Smartphones', 'slug' => 'smartphones', 'parent_id' => null],
            ['name' => 'Laptops', 'slug' => 'laptops', 'parent_id' => null],
            ['name' => 'Men\'s Clothing', 'slug' => 'mens-clothing', 'parent_id' => null],
            ['name' => 'Women\'s Clothing', 'slug' => 'womens-clothing', 'parent_id' => null],
        ];

        $createdCategories = [];
        foreach ($categories as $categoryData) {
            $createdCategories[] = Category::firstOrCreate(
                ['slug' => $categoryData['slug']],
                $categoryData
            );
        }

        // Product data with realistic names and descriptions
        $products = [
            [
                'name' => 'Premium Wireless Headphones',
                'slug' => 'premium-wireless-headphones',
                'short_description' => 'High-quality wireless headphones with noise cancellation',
                'description' => 'Experience premium audio quality with these wireless headphones. Features active noise cancellation, 30-hour battery life, and comfortable over-ear design.',
                'brand_id' => $createdBrands[0]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[0]->id, $createdCategories[5]->id],
                'variant_price' => 2999.99,
                'variant_compare_at_price' => 3499.99,
            ],
            [
                'name' => 'Smart Fitness Watch',
                'slug' => 'smart-fitness-watch',
                'short_description' => 'Track your fitness goals with this advanced smartwatch',
                'description' => 'Monitor your heart rate, steps, sleep, and more with this feature-packed fitness watch. Water-resistant and compatible with iOS and Android.',
                'brand_id' => $createdBrands[0]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[0]->id, $createdCategories[3]->id],
                'variant_price' => 4999.99,
                'variant_compare_at_price' => 5999.99,
            ],
            [
                'name' => 'Classic Denim Jacket',
                'slug' => 'classic-denim-jacket',
                'short_description' => 'Timeless denim jacket for everyday wear',
                'description' => 'A classic denim jacket that never goes out of style. Made from premium denim with a comfortable fit. Perfect for casual outings.',
                'brand_id' => $createdBrands[1]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[1]->id, $createdCategories[7]->id],
                'variants' => [
                    ['size' => 'S', 'price' => 2499.99],
                    ['size' => 'M', 'price' => 2499.99],
                    ['size' => 'L', 'price' => 2499.99],
                    ['size' => 'XL', 'price' => 2699.99],
                ],
            ],
            [
                'name' => 'Elegant Summer Dress',
                'slug' => 'elegant-summer-dress',
                'short_description' => 'Beautiful summer dress perfect for any occasion',
                'description' => 'Stay cool and stylish with this elegant summer dress. Made from breathable fabric with a flattering silhouette.',
                'brand_id' => $createdBrands[1]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[1]->id, $createdCategories[8]->id],
                'variants' => [
                    ['size' => 'S', 'price' => 1899.99],
                    ['size' => 'M', 'price' => 1899.99],
                    ['size' => 'L', 'price' => 1899.99],
                ],
            ],
            [
                'name' => 'Modern Coffee Maker',
                'slug' => 'modern-coffee-maker',
                'short_description' => 'Brew the perfect cup of coffee every time',
                'description' => 'Start your day right with this modern coffee maker. Features programmable settings, thermal carafe, and auto-shutoff.',
                'brand_id' => $createdBrands[2]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[2]->id],
                'variant_price' => 3499.99,
                'variant_compare_at_price' => 3999.99,
            ],
            [
                'name' => 'Yoga Mat Premium',
                'slug' => 'yoga-mat-premium',
                'short_description' => 'Non-slip yoga mat for all your fitness needs',
                'description' => 'Practice yoga comfortably with this premium non-slip mat. Extra thick for cushioning and support during your workouts.',
                'brand_id' => $createdBrands[3]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[3]->id],
                'variant_price' => 1299.99,
            ],
            [
                'name' => 'Skincare Set Complete',
                'slug' => 'skincare-set-complete',
                'short_description' => 'Complete skincare routine in one set',
                'description' => 'Transform your skin with this complete skincare set. Includes cleanser, toner, serum, and moisturizer. Suitable for all skin types.',
                'brand_id' => $createdBrands[4]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[4]->id],
                'variant_price' => 4499.99,
                'variant_compare_at_price' => 5499.99,
            ],
            [
                'name' => 'Gaming Laptop Pro',
                'slug' => 'gaming-laptop-pro',
                'short_description' => 'High-performance gaming laptop',
                'description' => 'Dominate your games with this powerful gaming laptop. Features latest processor, high-end graphics card, and fast SSD storage.',
                'brand_id' => $createdBrands[0]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[0]->id, $createdCategories[6]->id],
                'variants' => [
                    ['storage' => '512GB', 'price' => 89999.99],
                    ['storage' => '1TB', 'price' => 109999.99],
                ],
            ],
            [
                'name' => 'Wireless Mouse Ergonomic',
                'slug' => 'wireless-mouse-ergonomic',
                'short_description' => 'Comfortable wireless mouse for long work sessions',
                'description' => 'Work comfortably with this ergonomic wireless mouse. Features precision tracking, long battery life, and comfortable grip.',
                'brand_id' => $createdBrands[0]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[0]->id, $createdCategories[6]->id],
                'variant_price' => 1999.99,
            ],
            [
                'name' => 'Running Shoes Lightweight',
                'slug' => 'running-shoes-lightweight',
                'short_description' => 'Lightweight running shoes for maximum comfort',
                'description' => 'Run faster and longer with these lightweight running shoes. Features breathable mesh upper and cushioned sole for comfort.',
                'brand_id' => $createdBrands[3]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[3]->id],
                'variants' => [
                    ['size' => '7', 'price' => 3999.99],
                    ['size' => '8', 'price' => 3999.99],
                    ['size' => '9', 'price' => 3999.99],
                    ['size' => '10', 'price' => 3999.99],
                    ['size' => '11', 'price' => 4199.99],
                ],
            ],
            [
                'name' => 'Bluetooth Speaker Portable',
                'slug' => 'bluetooth-speaker-portable',
                'short_description' => 'Portable speaker with excellent sound quality',
                'description' => 'Take your music anywhere with this portable Bluetooth speaker. Waterproof design, 12-hour battery, and rich bass sound.',
                'brand_id' => $createdBrands[0]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[0]->id],
                'variant_price' => 2499.99,
                'variant_compare_at_price' => 2999.99,
            ],
            [
                'name' => 'Cotton T-Shirt Pack',
                'slug' => 'cotton-t-shirt-pack',
                'short_description' => 'Pack of 3 comfortable cotton t-shirts',
                'description' => 'Essential wardrobe item. Pack of 3 high-quality cotton t-shirts in various colors. Soft, breathable, and durable.',
                'brand_id' => $createdBrands[1]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[1]->id, $createdCategories[7]->id],
                'variants' => [
                    ['size' => 'M', 'price' => 1499.99],
                    ['size' => 'L', 'price' => 1499.99],
                    ['size' => 'XL', 'price' => 1499.99],
                ],
            ],
            [
                'name' => 'Mechanical Keyboard RGB',
                'slug' => 'mechanical-keyboard-rgb',
                'short_description' => 'RGB mechanical keyboard with customizable lighting',
                'description' => 'Enhance your gaming and typing experience with this mechanical keyboard. Features RGB backlighting, mechanical switches, and programmable keys.',
                'brand_id' => $createdBrands[0]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[0]->id, $createdCategories[6]->id],
                'variant_price' => 5999.99,
                'variant_compare_at_price' => 6999.99,
            ],
            [
                'name' => 'Wireless Earbuds Pro',
                'slug' => 'wireless-earbuds-pro',
                'short_description' => 'Premium wireless earbuds with active noise cancellation',
                'description' => 'Experience crystal-clear audio with these premium wireless earbuds. Features active noise cancellation, touch controls, and long battery life.',
                'brand_id' => $createdBrands[0]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[0]->id],
                'variant_price' => 3999.99,
                'variant_compare_at_price' => 4999.99,
            ],
            [
                'name' => 'Leather Jacket Classic',
                'slug' => 'leather-jacket-classic',
                'short_description' => 'Timeless leather jacket for men',
                'description' => 'A classic leather jacket that exudes style and sophistication. Made from genuine leather with a comfortable fit and timeless design.',
                'brand_id' => $createdBrands[1]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[1]->id, $createdCategories[7]->id],
                'variants' => [
                    ['size' => 'M', 'price' => 12999.99],
                    ['size' => 'L', 'price' => 12999.99],
                    ['size' => 'XL', 'price' => 13499.99],
                ],
            ],
            [
                'name' => 'Designer Handbag Elegant',
                'slug' => 'designer-handbag-elegant',
                'short_description' => 'Elegant designer handbag for every occasion',
                'description' => 'Carry your essentials in style with this elegant designer handbag. Features spacious interior, multiple compartments, and premium materials.',
                'brand_id' => $createdBrands[1]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[1]->id, $createdCategories[8]->id],
                'variant_price' => 8999.99,
                'variant_compare_at_price' => 10999.99,
            ],
            [
                'name' => 'Smart TV 55 Inch',
                'slug' => 'smart-tv-55-inch',
                'short_description' => '4K Ultra HD Smart TV with streaming apps',
                'description' => 'Transform your living room with this 55-inch 4K Smart TV. Features HDR support, built-in streaming apps, and voice control.',
                'brand_id' => $createdBrands[0]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[0]->id, $createdCategories[2]->id],
                'variants' => [
                    ['model' => 'Standard', 'price' => 89999.99],
                    ['model' => 'Premium', 'price' => 109999.99],
                ],
            ],
            [
                'name' => 'Air Purifier HEPA',
                'slug' => 'air-purifier-hepa',
                'short_description' => 'HEPA air purifier for clean indoor air',
                'description' => 'Breathe cleaner air with this HEPA air purifier. Removes 99.97% of airborne particles, allergens, and pollutants from your home.',
                'brand_id' => $createdBrands[2]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[2]->id],
                'variant_price' => 7999.99,
                'variant_compare_at_price' => 8999.99,
            ],
            [
                'name' => 'Tennis Racket Professional',
                'slug' => 'tennis-racket-professional',
                'short_description' => 'Professional-grade tennis racket',
                'description' => 'Improve your game with this professional tennis racket. Features carbon fiber construction, optimal weight distribution, and superior control.',
                'brand_id' => $createdBrands[3]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[3]->id],
                'variants' => [
                    ['grip' => '4 1/4', 'price' => 5999.99],
                    ['grip' => '4 3/8', 'price' => 5999.99],
                    ['grip' => '4 1/2', 'price' => 5999.99],
                ],
            ],
            [
                'name' => 'Face Serum Vitamin C',
                'slug' => 'face-serum-vitamin-c',
                'short_description' => 'Brightening vitamin C face serum',
                'description' => 'Achieve brighter, more radiant skin with this vitamin C serum. Reduces dark spots, evens skin tone, and provides antioxidant protection.',
                'brand_id' => $createdBrands[4]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[4]->id],
                'variant_price' => 2499.99,
                'variant_compare_at_price' => 2999.99,
            ],
            [
                'name' => 'Tablet 10 Inch',
                'slug' => 'tablet-10-inch',
                'short_description' => '10-inch tablet for work and entertainment',
                'description' => 'Stay productive and entertained with this 10-inch tablet. Features high-resolution display, long battery life, and powerful performance.',
                'brand_id' => $createdBrands[0]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[0]->id],
                'variants' => [
                    ['storage' => '64GB', 'price' => 19999.99],
                    ['storage' => '128GB', 'price' => 22999.99],
                ],
            ],
            [
                'name' => 'Winter Coat Warm',
                'slug' => 'winter-coat-warm',
                'short_description' => 'Warm winter coat for cold weather',
                'description' => 'Stay warm and stylish during winter with this insulated coat. Features water-resistant outer shell, warm inner lining, and multiple pockets.',
                'brand_id' => $createdBrands[1]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[1]->id, $createdCategories[7]->id],
                'variants' => [
                    ['size' => 'S', 'price' => 6999.99],
                    ['size' => 'M', 'price' => 6999.99],
                    ['size' => 'L', 'price' => 6999.99],
                    ['size' => 'XL', 'price' => 7499.99],
                ],
            ],
            [
                'name' => 'Desk Lamp LED',
                'slug' => 'desk-lamp-led',
                'short_description' => 'Adjustable LED desk lamp',
                'description' => 'Illuminate your workspace with this adjustable LED desk lamp. Features multiple brightness levels, color temperature control, and USB charging port.',
                'brand_id' => $createdBrands[2]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[2]->id],
                'variant_price' => 1999.99,
            ],
            [
                'name' => 'Basketball Official Size',
                'slug' => 'basketball-official-size',
                'short_description' => 'Official size basketball for indoor and outdoor',
                'description' => 'Practice and play with this official-size basketball. Suitable for both indoor and outdoor courts, with excellent grip and durability.',
                'brand_id' => $createdBrands[3]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[3]->id],
                'variant_price' => 2499.99,
            ],
            [
                'name' => 'Lipstick Set Premium',
                'slug' => 'lipstick-set-premium',
                'short_description' => 'Set of 6 premium lipstick shades',
                'description' => 'Complete your makeup collection with this premium lipstick set. Includes 6 long-lasting shades in matte and satin finishes.',
                'brand_id' => $createdBrands[4]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[4]->id],
                'variant_price' => 3499.99,
                'variant_compare_at_price' => 4499.99,
            ],
            [
                'name' => 'Webcam HD 1080p',
                'slug' => 'webcam-hd-1080p',
                'short_description' => 'HD 1080p webcam for video calls',
                'description' => 'Look your best on video calls with this HD 1080p webcam. Features auto-focus, built-in microphone, and privacy shutter.',
                'brand_id' => $createdBrands[0]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[0]->id, $createdCategories[6]->id],
                'variant_price' => 2999.99,
            ],
            [
                'name' => 'Jeans Slim Fit',
                'slug' => 'jeans-slim-fit',
                'short_description' => 'Slim fit jeans for everyday wear',
                'description' => 'Comfortable and stylish slim fit jeans. Made from premium denim with stretch for comfort and a flattering fit.',
                'brand_id' => $createdBrands[1]->id,
                'product_type' => 'variant',
                'published_status' => 'published',
                'is_featured' => false,
                'is_active' => true,
                'categories' => [$createdCategories[1]->id, $createdCategories[7]->id],
                'variants' => [
                    ['size' => '30', 'price' => 2999.99],
                    ['size' => '32', 'price' => 2999.99],
                    ['size' => '34', 'price' => 2999.99],
                    ['size' => '36', 'price' => 3199.99],
                ],
            ],
            [
                'name' => 'Stand Mixer Kitchen',
                'slug' => 'stand-mixer-kitchen',
                'short_description' => 'Powerful stand mixer for baking',
                'description' => 'Make baking easier with this powerful stand mixer. Features multiple speed settings, various attachments, and large capacity bowl.',
                'brand_id' => $createdBrands[2]->id,
                'product_type' => 'simple',
                'published_status' => 'published',
                'is_featured' => true,
                'is_active' => true,
                'categories' => [$createdCategories[2]->id],
                'variant_price' => 12999.99,
                'variant_compare_at_price' => 14999.99,
            ],
        ];

        foreach ($products as $productData) {
            $categories = $productData['categories'] ?? [];
            $variants = $productData['variants'] ?? [];
            $variantPrice = $productData['variant_price'] ?? null;
            $variantCompareAtPrice = $productData['variant_compare_at_price'] ?? null;
            
            unset($productData['categories'], $productData['variants'], $productData['variant_price'], $productData['variant_compare_at_price']);

            // Create product
            $product = Product::firstOrCreate(
                ['slug' => $productData['slug']],
                $productData
            );

            // Attach categories
            if (!empty($categories)) {
                $product->categories()->sync($categories);
            }

            // Create variants for variant products
            if ($product->product_type === 'variant' && !empty($variants)) {
                // Check if variants already exist
                if ($product->variants()->count() === 0) {
                    foreach ($variants as $index => $variantData) {
                        // Use product ID to ensure unique SKU
                        $sku = 'SKU-' . str_pad($product->id, 4, '0', STR_PAD_LEFT) . '-' . str_pad($index + 1, 3, '0', STR_PAD_LEFT);
                        ProductVariant::firstOrCreate(
                            [
                                'product_id' => $product->id,
                                'sku' => $sku,
                            ],
                            [
                                'sku' => $sku,
                                'barcode' => fake()->optional()->ean13(),
                                'price' => $variantData['price'],
                                'compare_at_price' => isset($variantData['compare_at_price']) ? $variantData['compare_at_price'] : null,
                                'currency' => 'BDT',
                                'track_stock' => true,
                                'allow_backorder' => false,
                                'status' => 'active',
                            ]
                        );
                    }
                }
            } elseif ($product->product_type === 'simple' && $variantPrice !== null) {
                // Create single variant for simple products if it doesn't exist
                if ($product->variants()->count() === 0) {
                    // Use product ID to ensure unique SKU
                    $sku = 'SKU-' . str_pad($product->id, 4, '0', STR_PAD_LEFT) . '-001';
                    ProductVariant::firstOrCreate(
                        [
                            'product_id' => $product->id,
                            'sku' => $sku,
                        ],
                        [
                            'sku' => $sku,
                            'barcode' => fake()->optional()->ean13(),
                            'price' => $variantPrice,
                            'compare_at_price' => $variantCompareAtPrice,
                            'currency' => 'BDT',
                            'track_stock' => true,
                            'allow_backorder' => false,
                            'status' => 'active',
                        ]
                    );
                }
            }
        }

        // Generate 200 random products using factories
        $this->command->info('Generating 200 random products...');
        
        $brandIds = Brand::pluck('id')->toArray();
        $categoryIds = Category::pluck('id')->toArray();
        
        $products = Product::factory()
            ->count(200)
            ->create([
                'published_status' => 'published',
                'is_active' => true,
                'brand_id' => function () use ($brandIds) {
                    return fake()->randomElement($brandIds);
                },
            ]);

        // Attach random categories to products and create variants
        foreach ($products as $product) {
            // Attach 1-3 random categories
            $randomCategories = fake()->randomElements($categoryIds, fake()->numberBetween(1, 3));
            $product->categories()->sync($randomCategories);

            // Create variants based on product type
            if ($product->product_type === 'simple') {
                // Create single variant for simple products
                $sku = 'SKU-' . str_pad($product->id, 4, '0', STR_PAD_LEFT) . '-001';
                ProductVariant::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'sku' => $sku,
                    ],
                    [
                        'sku' => $sku,
                        'barcode' => fake()->optional(0.7)->ean13(),
                        'price' => fake()->randomFloat(2, 500, 50000),
                        'compare_at_price' => fake()->optional(0.3)->randomFloat(2, 1000, 60000),
                        'currency' => 'BDT',
                        'track_stock' => true,
                        'allow_backorder' => fake()->boolean(20),
                        'status' => 'active',
                    ]
                );
            } elseif ($product->product_type === 'variant') {
                // Create 2-5 variants for variant products
                $variantCount = fake()->numberBetween(2, 5);
                for ($i = 0; $i < $variantCount; $i++) {
                    $sku = 'SKU-' . str_pad($product->id, 4, '0', STR_PAD_LEFT) . '-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT);
                    ProductVariant::firstOrCreate(
                        [
                            'product_id' => $product->id,
                            'sku' => $sku,
                        ],
                        [
                            'sku' => $sku,
                            'barcode' => fake()->optional(0.7)->ean13(),
                            'price' => fake()->randomFloat(2, 500, 50000),
                            'compare_at_price' => fake()->optional(0.3)->randomFloat(2, 1000, 60000),
                            'currency' => 'BDT',
                            'track_stock' => true,
                            'allow_backorder' => fake()->boolean(20),
                            'status' => 'active',
                        ]
                    );
                }
            }
        }

        $this->command->info('Products seeded successfully!');
        $this->command->info('Total products: ' . Product::count());
        $this->command->info('Featured products: ' . Product::where('is_featured', true)->count());
    }
}

