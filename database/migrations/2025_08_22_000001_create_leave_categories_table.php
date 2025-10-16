<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->boolean('is_paid')->default(true);
            $table->boolean('deduct_balance')->default(true);
            $table->boolean('half_day_allowed')->default(false);
            $table->enum('weekend_rule', ['workdays', 'calendar'])->default('workdays');
            $table->json('blackout')->nullable(); // JSON array of date ranges or rules
            $table->unsignedSmallInteger('base_quota_days')->nullable(); // e.g., 12 for Annual
            $table->boolean('prorate_on_join')->default(true);
            $table->boolean('prorate_on_resign')->default(true);
            $table->unsignedSmallInteger('carryover_max_days')->nullable();
            $table->unsignedSmallInteger('carryover_expiry_months')->nullable();
            $table->boolean('requires_proof')->default(false);
            $table->json('defaults')->nullable(); // category-specific defaults (e.g. alasan penting mapping)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_categories');
    }
};
