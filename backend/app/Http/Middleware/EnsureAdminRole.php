<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure Admin Role Middleware
 *
 * Verifies that the authenticated administrator has one of the required roles.
 * Supports role hierarchy where super_admin has access to everything.
 */
class EnsureAdminRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  The allowed roles for this route
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Get authenticated administrator
        $admin = $request->user('admin_sanctum');

        // If not authenticated, return 401 (this shouldn't happen with auth middleware)
        if (!$admin) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Super admin always has access
        if ($admin->isSuperAdmin()) {
            return $next($request);
        }

        // Check if admin has any of the required roles
        if ($admin->hasRole(...$roles)) {
            return $next($request);
        }

        // User doesn't have required role
        return response()->json([
            'message' => 'This action is unauthorized. Required role: ' . implode(' or ', $roles),
        ], 403);
    }
}
