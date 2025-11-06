<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminManagementController;
use App\Http\Controllers\Api\Admin\BrandController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\AttributeController;
use App\Http\Controllers\Api\Admin\AttributeValueController;
use App\Http\Controllers\Api\Admin\MediaController;
use App\Http\Controllers\Api\Admin\Inventory\WarehouseController;
use App\Http\Controllers\Api\Admin\Inventory\InventoryItemController;
use App\Http\Controllers\Api\Admin\Inventory\AdjustmentController;
use App\Http\Controllers\Api\Admin\Inventory\TransferController;
use App\Http\Controllers\Api\Admin\Inventory\MovementController;
use App\Http\Controllers\Api\Admin\Inventory\ReservationController;
use App\Http\Controllers\Api\Client\AddressController;
use App\Http\Controllers\Api\Client\ProductController as ClientProductController;
use App\Http\Controllers\Api\Client\CategoryController as ClientCategoryController;
use App\Http\Controllers\Api\Client\BrandController as ClientBrandController;
use App\Http\Controllers\Api\Client\CartController;
use App\Http\Controllers\Api\Client\OrderController;
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
    // Client Product Catalog Routes (Public)
    // ========================================

    // Products
    Route::get('/products', [ClientProductController::class, 'index'])->name('api.products.index');
    Route::get('/products/{id}', [ClientProductController::class, 'show'])->name('api.products.show');
    Route::get('/products/{id}/variants', [ClientProductController::class, 'variants'])->name('api.products.variants');

    // Categories
    Route::get('/categories', [ClientCategoryController::class, 'index'])->name('api.categories.index');
    Route::get('/categories/{id}', [ClientCategoryController::class, 'show'])->name('api.categories.show');

    // Brands
    Route::get('/brands', [ClientBrandController::class, 'index'])->name('api.brands.index');
    Route::get('/brands/{id}', [ClientBrandController::class, 'show'])->name('api.brands.show');

    // ========================================
    // Client Protected Routes
    // ========================================

    Route::middleware('auth:sanctum')->group(function () {
        // Address Management
        Route::apiResource('addresses', AddressController::class)->names([
            'index' => 'api.addresses.index',
            'store' => 'api.addresses.store',
            'show' => 'api.addresses.show',
            'update' => 'api.addresses.update',
            'destroy' => 'api.addresses.destroy',
        ]);
        Route::post('/addresses/{id}/set-default-billing', [AddressController::class, 'setDefaultBilling'])->name('api.addresses.set-default-billing');
        Route::post('/addresses/{id}/set-default-shipping', [AddressController::class, 'setDefaultShipping'])->name('api.addresses.set-default-shipping');

        // Cart Management
        Route::get('/cart', [CartController::class, 'index'])->name('api.cart.index');
        Route::post('/cart/items', [CartController::class, 'addItem'])->name('api.cart.items.store');
        Route::put('/cart/items/{id}', [CartController::class, 'updateItem'])->name('api.cart.items.update');
        Route::delete('/cart/items/{id}', [CartController::class, 'removeItem'])->name('api.cart.items.destroy');
        Route::delete('/cart', [CartController::class, 'clear'])->name('api.cart.clear');

        // Orders
        Route::get('/orders', [OrderController::class, 'index'])->name('api.orders.index');
        Route::post('/orders', [OrderController::class, 'store'])->name('api.orders.store');
        Route::get('/orders/{id}', [OrderController::class, 'show'])->name('api.orders.show');
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

            // Attribute Values (nested under attributes)
            Route::get('/attributes/{attribute}/values', [AttributeValueController::class, 'index'])->name('api.admin.attributes.values.index');
            Route::post('/attributes/{attribute}/values', [AttributeValueController::class, 'store'])->name('api.admin.attributes.values.store');
            Route::get('/attributes/{attribute}/values/{id}', [AttributeValueController::class, 'show'])->name('api.admin.attributes.values.show');
            Route::put('/attributes/{attribute}/values/{id}', [AttributeValueController::class, 'update'])->name('api.admin.attributes.values.update');
            Route::patch('/attributes/{attribute}/values/{id}', [AttributeValueController::class, 'update'])->name('api.admin.attributes.values.patch');
            Route::delete('/attributes/{attribute}/values/{id}', [AttributeValueController::class, 'destroy'])->name('api.admin.attributes.values.destroy');
            Route::post('/attributes/{attribute}/values/reorder', [AttributeValueController::class, 'reorder'])->name('api.admin.attributes.values.reorder');

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

            // ========================================
            // Admin Inventory Management Routes
            // ========================================

            // Warehouses
            Route::apiResource('inventory/warehouses', WarehouseController::class)->names([
                'index' => 'api.admin.inventory.warehouses.index',
                'store' => 'api.admin.inventory.warehouses.store',
                'show' => 'api.admin.inventory.warehouses.show',
                'update' => 'api.admin.inventory.warehouses.update',
                'destroy' => 'api.admin.inventory.warehouses.destroy',
            ]);

            // Inventory Items
            Route::get('/inventory/items', [InventoryItemController::class, 'index'])->name('api.admin.inventory.items.index');
            Route::get('/inventory/items/{id}', [InventoryItemController::class, 'show'])->name('api.admin.inventory.items.show');

            // Stock Adjustments
            Route::post('/inventory/adjustments', [AdjustmentController::class, 'store'])->name('api.admin.inventory.adjustments.store');

            // Transfers
            Route::get('/inventory/transfers', [TransferController::class, 'index'])->name('api.admin.inventory.transfers.index');
            Route::post('/inventory/transfers', [TransferController::class, 'store'])->name('api.admin.inventory.transfers.store');
            Route::get('/inventory/transfers/{id}', [TransferController::class, 'show'])->name('api.admin.inventory.transfers.show');
            Route::put('/inventory/transfers/{id}', [TransferController::class, 'update'])->name('api.admin.inventory.transfers.update');
            Route::patch('/inventory/transfers/{id}', [TransferController::class, 'update'])->name('api.admin.inventory.transfers.patch');
            Route::post('/inventory/transfers/{id}/dispatch', [TransferController::class, 'dispatch'])->name('api.admin.inventory.transfers.dispatch');
            Route::post('/inventory/transfers/{id}/receive', [TransferController::class, 'receive'])->name('api.admin.inventory.transfers.receive');
            Route::post('/inventory/transfers/{id}/cancel', [TransferController::class, 'cancel'])->name('api.admin.inventory.transfers.cancel');

            // Movements (History)
            Route::get('/inventory/movements', [MovementController::class, 'index'])->name('api.admin.inventory.movements.index');

            // Reservation/Release
            Route::post('/inventory/reserve', [ReservationController::class, 'reserve'])->name('api.admin.inventory.reserve');
            Route::post('/inventory/release', [ReservationController::class, 'release'])->name('api.admin.inventory.release');
        });
    });
});
