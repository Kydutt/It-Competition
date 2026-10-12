<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competition_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained('competitions')->cascadeOnDelete();
            $table->foreignId('registration_id')->constrained('registrations')->cascadeOnDelete();
            $table->decimal('final_score', 5, 2)->default(0);
            $table->unsignedInteger('rank')->default(0);
            $table->string('result_status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['competition_id', 'registration_id'], 'competition_registration_result_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competition_results');
    }
};
