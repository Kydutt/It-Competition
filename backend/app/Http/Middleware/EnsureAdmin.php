<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== Role::ADMIN) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Endpoint ini khusus untuk administrator.',
            ], 403);
        }

        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun administrator Anda dinonaktifkan.',
            ], 403);
        }

        return $next($request);
    }
}
