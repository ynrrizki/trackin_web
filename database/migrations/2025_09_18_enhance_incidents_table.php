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
        Schema::table('incidents', function (Blueprint $table) {
            // Add status field for incident lifecycle management
            $table->enum('status', ['reported', 'investigating', 'resolved', 'closed'])
                  ->default('reported')
                  ->after('severity');

            // Add follow-up actions tracking
            $table->json('follow_up_actions')->nullable()->after('handling_steps');

            // Add assigned officer for handling
            $table->foreignId('assigned_to_employee_id')
                  ->nullable()
                  ->constrained('employees')
                  ->nullOnDelete()
                  ->after('reporter_employee_id');

            // Add resolution details
            $table->text('resolution_notes')->nullable()->after('follow_up_actions');
            $table->timestamp('resolved_at')->nullable()->after('resolution_notes');

            // Add priority level
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])
                  ->default('medium')
                  ->after('severity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            $table->dropForeign(['assigned_to_employee_id']);
            $table->dropColumn([
                'status',
                'follow_up_actions',
                'assigned_to_employee_id',
                'resolution_notes',
                'resolved_at',
                'priority'
            ]);
        });
    }
};
