<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_entitlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('leave_category_id')->constrained('leave_categories')->cascadeOnDelete();
            $table->string('period', 16); // e.g., '2025' or '2025-08'
            $table->unsignedSmallInteger('opening')->default(0);
            $table->unsignedSmallInteger('accrual')->default(0);
            $table->unsignedSmallInteger('consumed')->default(0);
            $table->unsignedSmallInteger('carry_in')->default(0);
            $table->unsignedSmallInteger('carry_out')->default(0);
            $table->unsignedSmallInteger('closing')->default(0);
            $table->date('expires_at')->nullable();
            $table->timestamps();
            $table->unique(['employee_id', 'leave_category_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_entitlements');
    }
};
