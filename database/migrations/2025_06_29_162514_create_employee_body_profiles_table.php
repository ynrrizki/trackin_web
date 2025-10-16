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
        Schema::create('employee_body_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->decimal('height', 5, 2)->nullable(); // Height in cm
            $table->decimal('weight', 5, 2)->nullable(); // Weight in kg
            $table->enum('blood_type', ['A', 'B', 'AB', 'O', 'UNKNOWN'])->nullable();
            $table->enum('shirt_size', ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'CUSTOM', 'UNKNOWN'])->nullable();
            $table->string('shoe_size')->nullable(); // Shoe size, can be a string for custom sizes
            $table->string('health_notes')->nullable(); // Additional health notes
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_body_profiles');
    }
};
