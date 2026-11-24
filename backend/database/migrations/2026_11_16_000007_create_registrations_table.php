<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('registration_number', 64)->unique();
            $table->foreignId('competition_id')->constrained('competitions')->onDelete('restrict');
            $table->foreignId('participant_id')->nullable()->constrained('users')->onDelete('restrict');
            $table->foreignId('team_id')->nullable()->constrained('teams')->onDelete('restrict');
            $table->enum('status', ['draft', 'submitted', 'under_review', 'revision_required', 'approved', 'rejected', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->dateTime('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['competition_id', 'status']);
            $table->index('participant_id');
            $table->index('team_id');
            $table->index('submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
