<?php

declare(strict_types=1);

use App\Enums\TeamMemberRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('role')->default(TeamMemberRole::Member->value);
            $table->string('student_card_url')->nullable();
            $table->timestamps();

            $table->index(['team_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_members');
    }
};
