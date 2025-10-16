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
        Schema::create('salary_components', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g. Basic Salary, Overtime, Bonus
            $table->enum('type', ['EARNING', 'DEDUCTION', 'TAX', 'OTHER'])
                ->default('EARNING'); // Type of component
            $table->boolean('is_fixed')->default(false); // Whether the component is a fixed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_components');
    }
};
