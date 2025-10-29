<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateAdminRequest;
use App\Http\Requests\Admin\UpdateAdminRequest;
use App\Http\Resources\AdministratorResource;
use App\Models\Administrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Admin Management Controller
 *
 * Handles CRUD operations for administrators.
 * Only accessible by super_admin role.
 */
class AdminManagementController extends Controller
{
    /**
     * List all administrators with optional filtering.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Administrator::query();

        // Filter by role
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Order by latest
        $query->latest();

        // Paginate results
        $perPage = $request->input('per_page', 15);
        $administrators = $query->paginate($perPage);

        return response()->json([
            'data' => AdministratorResource::collection($administrators->items()),
            'meta' => [
                'current_page' => $administrators->currentPage(),
                'last_page' => $administrators->lastPage(),
                'per_page' => $administrators->perPage(),
                'total' => $administrators->total(),
            ],
        ]);
    }

    /**
     * Create a new administrator.
     *
     * @param CreateAdminRequest $request
     * @return JsonResponse
     */
    public function store(CreateAdminRequest $request): JsonResponse
    {
        // Create new administrator
        $admin = Administrator::create([
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'phone' => $request->phone,
            'role' => $request->role,
            'is_active' => $request->input('is_active', true),
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Administrator created successfully.',
            'data' => new AdministratorResource($admin),
        ], 201);
    }

    /**
     * View administrator details.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $admin = Administrator::findOrFail($id);

        return response()->json([
            'data' => new AdministratorResource($admin),
        ]);
    }

    /**
     * Update an administrator.
     *
     * @param UpdateAdminRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateAdminRequest $request, int $id): JsonResponse
    {
        $admin = Administrator::findOrFail($id);

        // Prevent super_admin from demoting themselves
        $currentUser = $request->user('admin_sanctum');
        if ($currentUser->id === $admin->id && $request->has('role') && $request->role !== 'super_admin') {
            return response()->json([
                'message' => 'You cannot change your own role.',
            ], 403);
        }

        // Update fields if provided
        if ($request->has('email')) {
            $admin->email = $request->email;
        }

        if ($request->has('password')) {
            $admin->password_hash = Hash::make($request->password);
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

        if ($request->has('role')) {
            $admin->role = $request->role;
        }

        if ($request->has('is_active')) {
            $admin->is_active = $request->is_active;
        }

        $admin->save();

        return response()->json([
            'message' => 'Administrator updated successfully.',
            'data' => new AdministratorResource($admin),
        ]);
    }

    /**
     * Soft delete an administrator.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $admin = Administrator::findOrFail($id);

        // Prevent super_admin from deleting themselves
        $currentUser = $request->user('admin_sanctum');
        if ($currentUser->id === $admin->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 403);
        }

        // Soft delete
        $admin->delete();

        return response()->json([
            'message' => 'Administrator deleted successfully.',
        ]);
    }

    /**
     * Activate an administrator.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function activate(int $id): JsonResponse
    {
        $admin = Administrator::findOrFail($id);

        $admin->update(['is_active' => true]);

        return response()->json([
            'message' => 'Administrator activated successfully.',
            'data' => new AdministratorResource($admin),
        ]);
    }

    /**
     * Deactivate an administrator.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function deactivate(Request $request, int $id): JsonResponse
    {
        $admin = Administrator::findOrFail($id);

        // Prevent super_admin from deactivating themselves
        $currentUser = $request->user('admin_sanctum');
        if ($currentUser->id === $admin->id) {
            return response()->json([
                'message' => 'You cannot deactivate your own account.',
            ], 403);
        }

        $admin->update(['is_active' => false]);

        // Revoke all tokens for deactivated admin
        $admin->tokens()->delete();

        return response()->json([
            'message' => 'Administrator deactivated successfully.',
            'data' => new AdministratorResource($admin),
        ]);
    }
}
