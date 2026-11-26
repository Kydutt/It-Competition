<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Non-destructive additive migration extending payments for Midtrans Snap.
     * Legacy manual-transfer columns are preserved nullable for historical compatibility.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->nullable()
                ->after('registration_id')
                ->constrained('users')
                ->onDelete('set null');

            $table->string('order_id', 100)->nullable()->unique()->after('user_id');
            $table->string('gateway', 30)->default('midtrans')->after('order_id');
            $table->string('payment_type', 50)->nullable()->after('payment_method');
            $table->string('snap_token', 255)->nullable()->after('payment_type');
            $table->string('snap_redirect_url', 500)->nullable()->after('snap_token');
            $table->string('midtrans_transaction_id', 100)->nullable()->after('snap_redirect_url');
            $table->string('midtrans_transaction_status', 50)->nullable()->after('midtrans_transaction_id');
            $table->string('fraud_status', 30)->nullable()->after('midtrans_transaction_status');
            $table->string('status', 30)->default('pending')->change();
            $table->dateTime('paid_at')->nullable()->after('status');
            $table->dateTime('expired_at')->nullable()->after('paid_at');
            $table->json('webhook_payload')->nullable()->after('expired_at');
            $table->dateTime('last_webhook_at')->nullable()->after('webhook_payload');

            $table->index('midtrans_transaction_id');
            $table->index(['status', 'created_at']);
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("
                ALTER TABLE payments
                ADD COLUMN paid_registration_id BIGINT UNSIGNED
                GENERATED ALWAYS AS (CASE WHEN status IN ('paid', 'verified') THEN registration_id ELSE NULL END) VIRTUAL
            ");

            DB::statement("
                ALTER TABLE payments
                ADD UNIQUE KEY uq_payment_single_paid_registration (paid_registration_id)
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE payments DROP KEY uq_payment_single_paid_registration');
            DB::statement('ALTER TABLE payments DROP COLUMN paid_registration_id');
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['midtrans_transaction_id']);
            $table->dropIndex(['status', 'created_at']);
            $table->dropForeign(['user_id']);
            $table->dropUnique(['order_id']);

            $table->dropColumn([
                'user_id',
                'order_id',
                'gateway',
                'payment_type',
                'snap_token',
                'snap_redirect_url',
                'midtrans_transaction_id',
                'midtrans_transaction_status',
                'fraud_status',
                'paid_at',
                'expired_at',
                'webhook_payload',
                'last_webhook_at',
            ]);
        });
    }
};
