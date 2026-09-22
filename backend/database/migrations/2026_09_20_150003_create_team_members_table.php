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
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role')->default(TeamMemberRole::Member->value);
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->unique(['team_id', 'user_id']);
            $table->index(['team_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_members');
    }
};
