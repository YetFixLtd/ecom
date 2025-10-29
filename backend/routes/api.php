<?php

use App\Http\Controllers\Api\AuthController;
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
});
