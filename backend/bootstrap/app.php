<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Register admin middleware aliases
        $middleware->alias([
            'admin.role' => \App\Http\Middleware\EnsureAdminRole::class,
            'admin.active' => \App\Http\Middleware\EnsureAdminActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle authentication exceptions for API routes
        $exceptions->renderable(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'error' => $e->getMessage(),
                ], 401);
            }
        });

        // Handle route not found exceptions (this catches the "Route [login] not defined" error)
        $exceptions->renderable(function (\Symfony\Component\Routing\Exception\RouteNotFoundException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'error' => 'Authentication required.',
                ], 401);
            }
        });
    })->create();
