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
        Schema::create('competitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->onDelete('restrict');
            $table->foreignId('category_id')->constrained('competition_categories')->onDelete('restrict');
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('short_description', 500)->nullable();
            $table->longText('description');
            $table->string('cover_image_path')->nullable();
            $table->text('eligibility')->nullable();
            $table->enum('registration_type', ['individual', 'team']);
            $table->unsignedTinyInteger('min_members')->default(1);
            $table->unsignedTinyInteger('max_members')->default(1);
            $table->decimal('registration_fee', 12, 2)->default(0.00);
            $table->dateTime('registration_start');
            $table->dateTime('registration_deadline');
            $table->dateTime('submission_deadline')->nullable();
            $table->enum('status', ['draft', 'published', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'archived'])->default('draft');
            $table->string('guidebook_path')->nullable();
            $table->json('contact_information')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['event_id', 'category_id', 'status']);
            $table->index(['registration_start', 'registration_deadline']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competitions');
    }
};
