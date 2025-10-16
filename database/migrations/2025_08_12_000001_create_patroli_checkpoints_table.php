<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('patroli_checkpoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('client_projects')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 6)->nullable();
            $table->decimal('longitude', 10, 6)->nullable();
            // Geofence radius in meters (added inline so migrate:fresh includes it without needing the later add-radius migration)
            $table->unsignedInteger('radius_m')->default(25);
            $table->unsignedInteger('sequence')->default(0);
            $table->boolean('active')->default(true);
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patroli_checkpoints');
    }
};
