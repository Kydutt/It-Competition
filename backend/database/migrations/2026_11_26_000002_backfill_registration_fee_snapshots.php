<?php

use App\Services\RegistrationFeeBackfillService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Execute only the strict general conservative backfill.
        // Ambiguous records remain NULL until explicitly verified.
        app(RegistrationFeeBackfillService::class)->runGeneralBackfill(false);
    }

    public function down(): void
    {
        // Deliberately a non-destructive no-op; snapshot column drop (if desired)
        // belongs strictly to the preceding additive schema migration.
    }
};
