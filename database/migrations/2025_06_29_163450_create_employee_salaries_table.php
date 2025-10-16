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
        Schema::create('employee_salaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('component_id')->constrained('salary_components')->cascadeOnDelete();
            $table->decimal('amount', 15, 2); // Amount for the salary component
            $table->date('effective_date'); // Date when this salary component becomes effective
            $table->boolean('is_active')->default(true); // Active status for the salary component
            $table->timestamps();
            
            // Add indexes for better query performance
            $table->index('is_active');
            $table->index(['employee_id', 'is_active']);
            $table->index(['component_id', 'is_active']);
            $table->index('effective_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_salaries');
    }
};
