<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('employee_histories', function (Blueprint $table) {
            $table->string('type', 30)->default('transfer')->after('employee_id'); // transfer | mutation | rotation
            $table->json('snapshot_before')->nullable()->after('effective_date');
            $table->json('snapshot_after')->nullable()->after('snapshot_before');
            $table->foreignId('initiated_by')->nullable()->after('snapshot_after')->constrained('users')->nullOnDelete();
            $table->string('approval_line')->nullable()->after('initiated_by');
            $table->timestamp('applied_at')->nullable()->after('approval_line');
            $table->timestamp('cancelled_at')->nullable()->after('applied_at');

            $table->index(['employee_id', 'effective_date']);
            $table->index(['type']);
        });
    }

    public function down(): void
    {
        Schema::table('employee_histories', function (Blueprint $table) {
            $table->dropIndex(['employee_id', 'effective_date']);
            $table->dropIndex(['type']);
            $table->dropColumn([
                'type', 'snapshot_before', 'snapshot_after', 'initiated_by', 'approval_line', 'applied_at', 'cancelled_at'
            ]);
        });
    }
};
