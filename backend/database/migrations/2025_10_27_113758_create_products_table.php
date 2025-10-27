<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the products table for storing main product information.
     * Supports different product types (simple, variant, bundle) and publication status.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('slug', 255)->unique();
            $table->string('short_description', 500)->nullable();
            $table->mediumText('description')->nullable();
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->enum('product_type', ['simple', 'variant', 'bundle'])->default('variant');
            $table->enum('published_status', ['draft', 'published', 'archived'])->default('draft');
            $table->enum('visibility', ['catalog', 'search', 'hidden'])->default('catalog');
            $table->string('tax_class', 64)->nullable();
            $table->string('hs_code', 32)->nullable()->comment('Harmonized System code for customs');
            $table->integer('weight_grams')->nullable();
            $table->integer('length_mm')->nullable();
            $table->integer('width_mm')->nullable();
            $table->integer('height_mm')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('seo_title', 191)->nullable();
            $table->string('seo_description', 255)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('brand_id');
            $table->index(['published_status', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
