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
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g. Shift Pagi, Shift Malam
            $table->time('start_time');
            $table->time('end_time');
            $table->double('latitude')->nullable(); // Optional latitude for shift location
            $table->double('longitude')->nullable(); // Optional longitude for shift location
            $table->integer('radius')->default(100); // Radius in meters for attendance check (default 100m)
            $table->string('description')->nullable(); // Optional description for the shift
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
