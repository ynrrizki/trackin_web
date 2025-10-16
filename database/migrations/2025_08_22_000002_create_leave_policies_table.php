<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_policies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_category_id')->constrained('leave_categories')->cascadeOnDelete();
            // scope targeting
            $table->enum('scope_type', ['company', 'department', 'branch', 'job_level', 'employee'])->default('company');
            $table->unsignedBigInteger('scope_id')->nullable(); // nullable for company-wide
            $table->unsignedInteger('priority')->default(100); // lower = higher priority
            // effective versioning
            $table->date('effective_start');
            $table->date('effective_end')->nullable();
            // rules overrides (use null to fallback to category)
            $table->unsignedSmallInteger('quota_days')->nullable();
            $table->boolean('prorate_on_join')->nullable();
            $table->boolean('prorate_on_resign')->nullable();
            $table->unsignedSmallInteger('carryover_max_days')->nullable();
            $table->unsignedSmallInteger('carryover_expiry_months')->nullable();
            $table->boolean('requires_proof')->nullable();
            $table->json('reason_durations')->nullable(); // for Alasan Penting mapping
            $table->boolean('cuti_bersama_deducts')->nullable();
            $table->json('blackout')->nullable();
            $table->timestamps();
            $table->index(['scope_type', 'scope_id', 'effective_start', 'effective_end'], 'lp_scope_eff_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_policies');
    }
};
