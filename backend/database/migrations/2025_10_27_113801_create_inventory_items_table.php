<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the inventory_items table for tracking current stock levels.
     * Stores on_hand and reserved quantities per variant per warehouse.
     * Available stock = on_hand - reserved.
     */
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->integer('on_hand')->default(0);
            $table->integer('reserved')->default(0);
            $table->integer('safety_stock')->default(0)->comment('Minimum stock threshold');
            $table->integer('reorder_point')->default(0)->comment('Reorder trigger level');
            $table->timestamps();
            
            // Unique constraint - one inventory item per variant per warehouse
            $table->unique(['variant_id', 'warehouse_id']);
            
            // Index for warehouse-based queries
            $table->index(['warehouse_id', 'variant_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};
