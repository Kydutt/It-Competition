<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('submissions')->cascadeOnDelete();
            $table->foreignId('judge_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('judging_criteria_id')->constrained('judging_criteria')->cascadeOnDelete();
            $table->decimal('score', 5, 2);
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->unique(['submission_id', 'judge_id', 'judging_criteria_id'], 'submission_judge_criteria_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scores');
    }
};
