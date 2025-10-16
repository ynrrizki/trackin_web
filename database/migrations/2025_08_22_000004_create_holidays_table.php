<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('name');
            $table->boolean('is_cuti_bersama')->default(false);
            $table->timestamps();
            $table->unique(['date', 'name']);
            $table->index(['date', 'is_cuti_bersama']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
