<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the inventory_adjustments table for human-initiated stock changes.
     * Used for manual stock corrections, cycle counts, and write-offs.
     * Each adjustment creates a corresponding inventory_movement record.
     */
    public function up(): void
    {
        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->enum('adjustment_mode', ['SET_ON_HAND', 'DELTA_ON_HAND'])->comment('SET for absolute value, DELTA for +/-');
            $table->integer('qty_before');
            $table->integer('qty_change');
            $table->integer('qty_after');
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->string('reason_code', 64)->nullable()->comment('e.g., DAMAGED, LOST, COUNT_CORRECTION');
            $table->text('note')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('administrators')->nullOnDelete();
            $table->timestamp('performed_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            // Index
            $table->index(['variant_id', 'warehouse_id', 'performed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_adjustments');
    }
};
