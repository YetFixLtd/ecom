<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the addresses table for storing user shipping and billing addresses.
     * Supports multiple addresses per user with default billing/shipping flags.
     */
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 191)->comment('e.g., "Home", "Office"');
            $table->string('contact_name', 191)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('line1', 191);
            $table->string('line2', 191)->nullable();
            $table->string('city', 120);
            $table->string('state_region', 120)->nullable();
            $table->string('postal_code', 30)->nullable();
            $table->char('country_code', 2)->default('BD');
            $table->boolean('is_default_billing')->default(false);
            $table->boolean('is_default_shipping')->default(false);
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index(['country_code', 'state_region', 'city']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
