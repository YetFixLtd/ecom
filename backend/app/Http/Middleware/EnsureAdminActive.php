<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure Admin Active Middleware
 *
 * Verifies that the authenticated administrator account is active.
 * Inactive administrators cannot access protected routes.
 */
class EnsureAdminActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get authenticated administrator
        $admin = $request->user('admin_sanctum');

        // If not authenticated, return 401
        if (!$admin) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Check if admin is active
        if (!$admin->is_active) {
            return response()->json([
                'message' => 'Your administrator account has been deactivated. Please contact the system administrator.',
            ], 403);
        }

        return $next($request);
    }
}
