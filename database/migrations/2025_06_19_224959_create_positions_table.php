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
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_type_id')->nullable()->default(1)->constrained(); // Link position to employee type (NEW ADDED !!! "default 1 for internal")
            $table->string('code')->unique(); // e.g. DEV, HRD
            $table->string('name')->unique(); // e.g. Developer, HRD
            $table->enum('status', ['active', 'inactive'])->default('active'); // Status of the position
            $table->string('description')->nullable(); // Optional description of the position
            $table->softDeletes(); // For soft delete functionality
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
