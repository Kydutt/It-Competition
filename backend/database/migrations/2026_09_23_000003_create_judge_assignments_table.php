<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('judge_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('judge_id')->constrained('judges')->cascadeOnDelete();
            $table->foreignId('competition_id')->constrained('competitions')->cascadeOnDelete();
            $table->foreignId('registration_id')->constrained('registrations')->cascadeOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('assigned');
            $table->text('conflict_reason')->nullable();
            $table->timestamps();

            $table->unique(['judge_id', 'registration_id'], 'judge_registration_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('judge_assignments');
    }
};
