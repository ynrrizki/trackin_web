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
        Schema::create('approvable_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Unique name for the approvable type
            $table->string('model_class')->unique(); // Fully qualified model class name for the approvable type
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approvable_types');
    }
};
