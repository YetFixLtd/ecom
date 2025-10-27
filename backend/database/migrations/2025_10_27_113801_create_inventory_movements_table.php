<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the inventory_movements table - an immutable ledger of all stock changes.
     * Every inventory transaction creates a movement record for audit trail.
     */
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->integer('qty_change')->comment('Signed integer: + for incoming, - for outgoing');
            $table->enum('movement_type', [
                'purchase',
                'sale',
                'return_in',
                'return_out',
                'adjustment',
                'transfer_in',
                'transfer_out',
                'production_in',
                'consumption_out',
                'reservation',
                'release'
            ]);
            $table->string('reference_type', 64)->nullable()->comment('e.g., "order", "purchase_order", "transfer"');
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->decimal('unit_cost', 12, 2)->nullable()->comment('For COGS calculation');
            $table->string('reason_code', 64)->nullable()->comment('e.g., DAMAGED, LOST, COUNT_CORRECTION');
            $table->string('note', 500)->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('administrators')->nullOnDelete();
            $table->timestamp('performed_at')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index(['variant_id', 'performed_at']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
