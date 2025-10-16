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
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            // Pelapor (employee) – nullable karena data lama / optional
            $table->foreignId('reporter_employee_id')
                ->nullable()
                ->constrained('employees')
                ->nullOnDelete();
            $table->foreignId('category_id')->constrained('incident_categories')->cascadeOnDelete();
            $table->dateTime('incident_at');
            $table->string('long')->nullable();
            $table->string('lat')->nullable();
            $table->string('location')->nullable();
            $table->string('related_name')->nullable();
            $table->string('related_status')->nullable();
            $table->string('severity')->default('Rendah');
            $table->text('description')->nullable();
            $table->text('handling_steps')->nullable();
            $table->string('photo_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
