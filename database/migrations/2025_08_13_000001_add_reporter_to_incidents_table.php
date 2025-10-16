<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            if (!Schema::hasColumn('incidents', 'reporter_employee_id')) {
                $table->foreignId('reporter_employee_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('employees')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            if (Schema::hasColumn('incidents', 'reporter_employee_id')) {
                $table->dropConstrainedForeignId('reporter_employee_id');
            }
        });
    }
};
