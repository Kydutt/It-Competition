<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
                'errors' => (object) [],
            ], Response::HTTP_UNAUTHORIZED);
        }

        $userRoleValue = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;

        if (! in_array($userRoleValue, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden: You do not have permission to access this resource.',
                'errors' => (object) [],
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
