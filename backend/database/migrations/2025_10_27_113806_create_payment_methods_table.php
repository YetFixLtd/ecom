<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the payment_methods table for configuring available payment options.
     * Supports multiple payment providers and gateways.
     */
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191)->comment('Display name (e.g., Credit Card, bKash, Cash on Delivery)');
            $table->string('code', 64)->unique()->comment('Internal code (e.g., stripe, bkash, cod, ssl_commerz)');
            $table->string('provider', 64)->comment('Provider/gateway identifier');
            $table->text('description')->nullable();
            $table->enum('type', ['online', 'cod', 'wallet', 'bank_transfer'])->comment('Payment method type');
            $table->decimal('processing_fee', 12, 2)->default(0)->comment('Processing fee percentage or fixed amount');
            $table->enum('fee_type', ['percentage', 'fixed'])->default('percentage')->comment('How processing fee is calculated');
            $table->decimal('min_amount', 12, 2)->nullable()->comment('Minimum order amount');
            $table->decimal('max_amount', 12, 2)->nullable()->comment('Maximum order amount');
            $table->boolean('requires_online_payment')->default(true)->comment('If false, payment can be made offline (e.g., COD)');
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0)->comment('Display order');
            $table->json('config')->nullable()->comment('Additional configuration (API keys, endpoints, etc.)');
            $table->timestamps();

            // Indexes
            $table->index('code');
            $table->index('provider');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
