<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChangePasswordRequest;
use App\Http\Requests\Admin\LoginRequest;
use App\Http\Requests\Admin\UpdateProfileRequest;
use App\Http\Resources\AdministratorResource;
use App\Models\Administrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Admin Authentication Controller
 *
 * Handles administrator authentication, profile management, and password changes.
 * Uses Laravel Sanctum for token-based authentication with admin_sanctum guard.
 */
class AdminAuthController extends Controller
{
    /**
     * Authenticate administrator and return token.
     *
     * @param LoginRequest $request
     * @return JsonResponse
     */
    public function login(LoginRequest $request): JsonResponse
    {
        // Find administrator by email
        $admin = Administrator::where('email', $request->email)->first();

        // Check credentials
        if (!$admin || !Hash::check($request->password, $admin->password_hash)) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => [
                    'email' => ['The provided credentials are incorrect.'],
                ],
            ], 422);
        }

        // Check if admin is active
        if (!$admin->is_active) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => [
                    'email' => ['Your administrator account has been deactivated. Please contact the system administrator.'],
                ],
            ], 422);
        }

        // Revoke all existing tokens (only one active session per admin)
        $admin->tokens()->delete();

        // Update last login timestamp
        $admin->update(['last_login_at' => now()]);

        // Generate new token
        $token = $admin->createToken('admin-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'data' => [
                'administrator' => new AdministratorResource($admin),
                'token' => $token,
            ],
        ]);
    }

    /**
     * Logout the authenticated administrator.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        // Revoke the current access token
        $request->user('admin_sanctum')->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get the authenticated administrator's profile.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new AdministratorResource($request->user('admin_sanctum')),
        ]);
    }

    /**
     * Update the authenticated administrator's profile.
     *
     * @param UpdateProfileRequest $request
     * @return JsonResponse
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $admin = $request->user('admin_sanctum');

        // Update only provided fields
        if ($request->has('email')) {
            $admin->email = $request->email;
        }

        if ($request->has('first_name')) {
            $admin->first_name = $request->first_name;
        }

        if ($request->has('last_name')) {
            $admin->last_name = $request->last_name;
        }

        if ($request->has('phone')) {
            $admin->phone = $request->phone;
        }

        $admin->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data' => new AdministratorResource($admin),
        ]);
    }

    /**
     * Change the authenticated administrator's password.
     *
     * @param ChangePasswordRequest $request
     * @return JsonResponse
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $admin = $request->user('admin_sanctum');

        // Verify current password
        if (!Hash::check($request->current_password, $admin->password_hash)) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => [
                    'current_password' => ['The current password is incorrect.'],
                ],
            ], 422);
        }

        // Update password
        $admin->password_hash = Hash::make($request->password);
        $admin->save();

        // Revoke all tokens to force re-login (security best practice)
        $admin->tokens()->delete();

        return response()->json([
            'message' => 'Password changed successfully. Please login again.',
        ]);
    }
}
