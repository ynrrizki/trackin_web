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
        Schema::create('employee_bpjs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->enum('bpjs_type', ['KS', 'TK']); // Type of BPJS
            $table->string('participant_number')->unique(); // Unique participant number
            $table->enum('contribution_type', [
                'BY-COMPANY',
                'BY-EMPLOYEE',
                'DEFAULT',
            ])->default('BY-COMPANY');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_bpjs');
    }
};
