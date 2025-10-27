<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the payments table for tracking order payments.
     * Supports multiple payment providers and statuses.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('provider', 64)->comment('e.g., stripe, bkash, nagad, cod, ssl_commerz');
            $table->string('provider_ref', 191)->nullable()->comment('External transaction ID');
            $table->decimal('amount', 12, 2);
            $table->char('currency', 3);
            $table->enum('status', ['pending', 'authorized', 'captured', 'failed', 'refunded'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            // Index
            $table->index(['provider', 'provider_ref']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
