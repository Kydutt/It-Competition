<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competitions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique()->index();
            $table->string('category')->index();
            $table->string('competition_type')->default('team')->index();
            $table->text('description');
            $table->string('theme')->nullable();
            $table->string('target_level')->index();
            $table->unsignedBigInteger('registration_fee')->default(0);
            $table->unsignedInteger('quota')->default(50);
            $table->unsignedTinyInteger('min_team_member')->default(1);
            $table->unsignedTinyInteger('max_team_member')->default(3);
            $table->timestamp('registration_start')->nullable()->index();
            $table->timestamp('registration_end')->nullable()->index();
            $table->timestamp('submission_start')->nullable();
            $table->timestamp('submission_deadline')->nullable();
            $table->string('status')->default('draft')->index();
            $table->boolean('is_published')->default(false)->index();
            $table->string('guidebook_url')->nullable();
            $table->string('poster_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competitions');
    }
};
