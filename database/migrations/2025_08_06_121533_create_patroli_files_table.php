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
        Schema::create('patroli_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patroli_id')
                ->constrained('patrolis')
                ->onDelete('cascade'); // Assuming 'patrolis' is the table for patrol records
            $table->string('file_path'); // Path to the file
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patroli_files');
    }
};
