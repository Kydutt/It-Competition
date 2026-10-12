<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scores', function (Blueprint $table) {
            $table->foreignId('judging_session_id')->nullable()->after('id')->constrained('judging_sessions')->cascadeOnDelete();
            $table->text('comment')->nullable()->after('feedback');
        });
    }

    public function down(): void
    {
        Schema::table('scores', function (Blueprint $table) {
            $table->dropForeign(['judging_session_id']);
            $table->dropColumn(['judging_session_id', 'comment']);
        });
    }
};
