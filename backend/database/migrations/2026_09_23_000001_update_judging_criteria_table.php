<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('judging_criteria', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('max_score');
            $table->boolean('is_active')->default(true)->after('sort_order');
        });
    }

    public function down(): void
    {
        Schema::table('judging_criteria', function (Blueprint $table) {
            $table->dropColumn(['sort_order', 'is_active']);
        });
    }
};
