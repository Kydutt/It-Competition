<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Enforces database-level integrity and concurrent race condition prevention on registrations.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            // 1. Enforce Mutual Exclusivity: exactly one of participant_id OR team_id must be set.
            DB::statement("
                ALTER TABLE registrations 
                ADD CONSTRAINT chk_registration_subject 
                CHECK (
                    (participant_id IS NOT NULL AND team_id IS NULL) OR 
                    (participant_id IS NULL AND team_id IS NOT NULL)
                )
            ");

            // 2. Add Virtual Generated Columns to enforce active registration uniqueness.
            // When status is 'cancelled', the virtual column is NULL (allowing re-registration).
            // When status is active, it holds the ID, preventing concurrent duplicate active registrations.
            DB::statement("
                ALTER TABLE registrations 
                ADD COLUMN active_participant_id BIGINT UNSIGNED 
                GENERATED ALWAYS AS (CASE WHEN status != 'cancelled' THEN participant_id ELSE NULL END) VIRTUAL
            ");

            DB::statement("
                ALTER TABLE registrations 
                ADD COLUMN active_team_id BIGINT UNSIGNED 
                GENERATED ALWAYS AS (CASE WHEN status != 'cancelled' THEN team_id ELSE NULL END) VIRTUAL
            ");

            DB::statement("
                ALTER TABLE registrations 
                ADD UNIQUE KEY uq_competition_active_participant (competition_id, active_participant_id)
            ");

            DB::statement("
                ALTER TABLE registrations 
                ADD UNIQUE KEY uq_competition_active_team (competition_id, active_team_id)
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE registrations DROP CHECK chk_registration_subject");
            DB::statement("ALTER TABLE registrations DROP KEY uq_competition_active_participant");
            DB::statement("ALTER TABLE registrations DROP KEY uq_competition_active_team");
            DB::statement("ALTER TABLE registrations DROP COLUMN active_participant_id");
            DB::statement("ALTER TABLE registrations DROP COLUMN active_team_id");
        }
    }
};
