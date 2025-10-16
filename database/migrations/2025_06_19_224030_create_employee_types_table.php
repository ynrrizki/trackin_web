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
        Schema::create('employee_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g. INT, OUT
            $table->string('name')->unique(); // e.g. Internal, Outsourcing, Freelance
            $table->enum('status', ['active', 'inactive'])->default('active'); // status of the employee type
            $table->text('description')->nullable(); // Additional description of the employee type
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_types');
    }
};
