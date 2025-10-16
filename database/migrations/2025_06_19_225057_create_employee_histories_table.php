<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('employee_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();

            $table->foreignId('from_position_id')->constrained('positions')->cascadeOnDelete();
            $table->foreignId('to_position_id')->constrained('positions')->cascadeOnDelete();

            $table->foreignId('from_level_id')->constrained('position_levels')->cascadeOnDelete();
            $table->foreignId('to_level_id')->constrained('position_levels')->cascadeOnDelete();

            $table->foreignId('from_department_id')->constrained('departments')->cascadeOnDelete();
            $table->foreignId('to_department_id')->constrained('departments')->cascadeOnDelete();

            $table->foreignId('from_shift_id')->nullable()->constrained('shifts')->nullOnDelete();
            $table->foreignId('to_shift_id')->nullable()->constrained('shifts')->nullOnDelete();

            $table->foreignId('from_employment_status_id')->constrained('employment_statuses')->cascadeOnDelete();
            $table->foreignId('to_employment_status_id')->constrained('employment_statuses')->cascadeOnDelete();

            $table->text('change_reason')->nullable();
            $table->date('effective_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_histories');
    }
};
