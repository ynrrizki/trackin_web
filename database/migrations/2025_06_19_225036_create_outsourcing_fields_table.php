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
        Schema::create('outsourcing_fields', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name')->unique(); // e.g. Security, Cleaning, Driver
            $table->enum('status', ['active', 'inactive'])->default('active'); // status of the outsourcing field
            $table->text('description')->nullable(); // Additional description of the outsourcing field
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('outsourcing_fields');
    }
};
