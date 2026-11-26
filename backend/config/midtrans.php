<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Midtrans Snap Configuration
    |--------------------------------------------------------------------------
    |
    | Midtrans Sandbox is enforced by default during development and testing.
    | Keep MIDTRANS_SERVER_KEY and MIDTRANS_SIGNATURE_SECRET strictly on the
    | backend; never expose them to frontend assets, logs, or API responses.
    |
    */

    'server_key' => (string) env('MIDTRANS_SERVER_KEY', ''),

    'signature_secret' => (string) env('MIDTRANS_SIGNATURE_SECRET', ''),

    'client_key' => (string) env('MIDTRANS_CLIENT_KEY', ''),

    'is_production' => filter_var(env('MIDTRANS_IS_PRODUCTION', false), FILTER_VALIDATE_BOOLEAN),

    'is_sanitized' => filter_var(env('MIDTRANS_IS_SANITIZED', true), FILTER_VALIDATE_BOOLEAN),

    'is_3ds' => filter_var(env('MIDTRANS_IS_3DS', true), FILTER_VALIDATE_BOOLEAN),

    'expiry_minutes' => (int) env('MIDTRANS_EXPIRY_MINUTES', 1440),

    'timeout_seconds' => (int) env('MIDTRANS_TIMEOUT_SECONDS', 15),
];
