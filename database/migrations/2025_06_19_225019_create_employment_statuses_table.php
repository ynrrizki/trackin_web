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
        Schema::create('employment_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g. PERM, CONT, INT
            $table->string('name')->unique(); // e.g. Permanent, Contract, Internship
            $table->enum('status', ['active', 'inactive'])->default('active'); // status of the employment status
            $table->text('description')->nullable(); // Additional description of the employment status
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employment_statuses');
    }
};
