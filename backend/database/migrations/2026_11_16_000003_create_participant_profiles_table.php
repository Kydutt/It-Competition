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
        Schema::create('participant_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('phone', 30)->nullable();
            $table->string('institution')->nullable();
            $table->string('education_level', 50)->nullable();
            $table->string('identity_number', 50)->nullable();
            $table->text('address')->nullable();
            $table->string('profile_photo_path')->nullable();
            $table->timestamps();

            $table->index('institution');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('participant_profiles');
    }
};
