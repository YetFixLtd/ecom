<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the shipping_methods table for configuring available shipping options.
     * Supports multiple carriers, calculation types, and rate configurations.
     */
    public function up(): void
    {
        Schema::create('shipping_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191)->comment('Display name (e.g., Standard Shipping, Express Delivery)');
            $table->string('code', 64)->unique()->comment('Internal code (e.g., standard, express, overnight)');
            $table->string('carrier', 64)->nullable()->comment('Carrier name (e.g., DHL, FedEx, Local Courier)');
            $table->text('description')->nullable();
            $table->enum('calculation_type', ['flat', 'weight', 'price', 'weight_and_price'])->default('flat')->comment('How shipping cost is calculated');
            $table->decimal('base_rate', 12, 2)->default(0)->comment('Base shipping rate');
            $table->decimal('per_kg_rate', 12, 2)->nullable()->comment('Rate per kilogram (if weight-based)');
            $table->decimal('per_item_rate', 12, 2)->nullable()->comment('Rate per item');
            $table->decimal('free_shipping_threshold', 12, 2)->nullable()->comment('Order total for free shipping');
            $table->decimal('max_weight_kg', 10, 2)->nullable()->comment('Maximum weight in kg');
            $table->integer('estimated_days')->nullable()->comment('Estimated delivery days');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0)->comment('Display order');
            $table->json('config')->nullable()->comment('Additional configuration (zones, conditions, etc.)');
            $table->timestamps();

            // Indexes
            $table->index('code');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipping_methods');
    }
};
