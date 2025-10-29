<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminManagementController;
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
    });
});
