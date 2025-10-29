<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminManagementController;
use App\Http\Controllers\Api\Admin\BrandController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\AttributeController;
use App\Http\Controllers\Api\Admin\MediaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::prefix('v1')->group(function () {
    // ========================================
    // User/Customer Authentication Routes
    // ========================================

    // Public authentication routes (with rate limiting)
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register'])->name('api.auth.register');
        Route::post('/auth/login', [AuthController::class, 'login'])->name('api.auth.login');
    });

    // Protected authentication routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.auth.logout');
        Route::get('/auth/me', [AuthController::class, 'me'])->name('api.auth.me');
        Route::put('/auth/profile', [AuthController::class, 'updateProfile'])->name('api.auth.profile');
        Route::put('/auth/password', [AuthController::class, 'changePassword'])->name('api.auth.password');
    });

    // ========================================
    // Admin Authentication & Management Routes
    // ========================================

    Route::prefix('admin')->group(function () {
        // Public admin login (with rate limiting)
        Route::middleware('throttle:5,1')->group(function () {
            Route::post('/auth/login', [AdminAuthController::class, 'login'])->name('api.admin.auth.login');
        });

        // Protected admin authentication routes
        Route::middleware(['auth:admin_sanctum', 'admin.active'])->group(function () {
            Route::post('/auth/logout', [AdminAuthController::class, 'logout'])->name('api.admin.auth.logout');
            Route::get('/auth/me', [AdminAuthController::class, 'me'])->name('api.admin.auth.me');
            Route::put('/auth/profile', [AdminAuthController::class, 'updateProfile'])->name('api.admin.auth.profile');
            Route::put('/auth/password', [AdminAuthController::class, 'changePassword'])->name('api.admin.auth.password');
        });

        // Admin management routes (super_admin only)
        Route::middleware(['auth:admin_sanctum', 'admin.active', 'admin.role:super_admin'])->group(function () {
            Route::get('/administrators', [AdminManagementController::class, 'index'])->name('api.admin.administrators.index');
            Route::post('/administrators', [AdminManagementController::class, 'store'])->name('api.admin.administrators.store');
            Route::get('/administrators/{id}', [AdminManagementController::class, 'show'])->name('api.admin.administrators.show');
            Route::put('/administrators/{id}', [AdminManagementController::class, 'update'])->name('api.admin.administrators.update');
            Route::delete('/administrators/{id}', [AdminManagementController::class, 'destroy'])->name('api.admin.administrators.destroy');
            Route::post('/administrators/{id}/activate', [AdminManagementController::class, 'activate'])->name('api.admin.administrators.activate');
            Route::post('/administrators/{id}/deactivate', [AdminManagementController::class, 'deactivate'])->name('api.admin.administrators.deactivate');
        });

        // ========================================
        // Admin Catalog Management Routes
        // ========================================

        // Catalog routes (super_admin and admin)
        Route::middleware(['auth:admin_sanctum', 'admin.active', 'admin.role:super_admin,admin'])->group(function () {
            // Brands
            Route::apiResource('brands', BrandController::class)->names([
                'index' => 'api.admin.brands.index',
                'store' => 'api.admin.brands.store',
                'show' => 'api.admin.brands.show',
                'update' => 'api.admin.brands.update',
                'destroy' => 'api.admin.brands.destroy',
            ]);

            // Categories
            Route::apiResource('categories', CategoryController::class)->names([
                'index' => 'api.admin.categories.index',
                'store' => 'api.admin.categories.store',
                'show' => 'api.admin.categories.show',
                'update' => 'api.admin.categories.update',
                'destroy' => 'api.admin.categories.destroy',
            ]);

            // Attributes
            Route::apiResource('attributes', AttributeController::class)->names([
                'index' => 'api.admin.attributes.index',
                'store' => 'api.admin.attributes.store',
                'show' => 'api.admin.attributes.show',
                'update' => 'api.admin.attributes.update',
                'destroy' => 'api.admin.attributes.destroy',
            ]);

            // Products
            Route::get('/products', [ProductController::class, 'index'])->name('api.admin.products.index');
            Route::post('/products', [ProductController::class, 'store'])->name('api.admin.products.store');
            Route::get('/products/{id}', [ProductController::class, 'show'])->name('api.admin.products.show');
            Route::put('/products/{id}', [ProductController::class, 'update'])->name('api.admin.products.update');
            Route::patch('/products/{id}', [ProductController::class, 'update'])->name('api.admin.products.patch');
            Route::delete('/products/{id}', [ProductController::class, 'destroy'])->name('api.admin.products.destroy');

            // Product-specific operations
            Route::put('/products/{id}/pricing', [ProductController::class, 'updatePricing'])->name('api.admin.products.pricing.update');
            Route::put('/products/{id}/inventory', [ProductController::class, 'updateInventory'])->name('api.admin.products.inventory.update');
            Route::put('/products/{id}/attributes', [ProductController::class, 'syncAttributes'])->name('api.admin.products.attributes.sync');

            // Product Images (Media)
            Route::get('/products/{productId}/images', [MediaController::class, 'indexImages'])->name('api.admin.products.images.index');
            Route::post('/products/{productId}/images', [MediaController::class, 'storeImage'])->name('api.admin.products.images.store');
            Route::delete('/products/{productId}/images/{imageId}', [MediaController::class, 'destroyImage'])->name('api.admin.products.images.destroy');
        });
    });
});
