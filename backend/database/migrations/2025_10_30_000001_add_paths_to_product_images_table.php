<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->string('path_original')->nullable()->after('url');
            $table->string('path_medium')->nullable()->after('path_original');
            $table->string('path_thumb')->nullable()->after('path_medium');
            // Keep existing columns (url, position, is_primary) for backward compatibility
        });
    }

    public function down(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->dropColumn(['path_original', 'path_medium', 'path_thumb']);
        });
    }
};
