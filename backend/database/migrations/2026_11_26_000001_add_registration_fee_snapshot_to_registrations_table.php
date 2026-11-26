<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->decimal('registration_fee_snapshot', 12, 2)->nullable()->after('status');
            $table->dateTime('fee_locked_at')->nullable()->after('registration_fee_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn(['fee_locked_at', 'registration_fee_snapshot']);
        });
    }
};
