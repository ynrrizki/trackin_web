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
        Schema::create('shift_projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('shift_id')->constrained('shifts')->cascadeOnDelete(); // Foreign key to shifts table
            $table->foreignId('client_project_id')->constrained('client_projects')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_projects');
    }
};
