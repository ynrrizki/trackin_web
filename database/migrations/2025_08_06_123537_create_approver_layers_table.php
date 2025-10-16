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
        Schema::create('approver_layers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approvable_type_id')->constrained('approvable_types'); // Foreign key to the approvable type
            $table->morphs('approver');
            $table->enum('status', ['active', 'inactive'])->default('active'); // Status of the approver layer
            $table->string('description')->nullable(); // Optional description of the approver layer
            $table->unsignedInteger('level'); // Level of the approver in the hierarchy
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approver_layers');
    }
};
