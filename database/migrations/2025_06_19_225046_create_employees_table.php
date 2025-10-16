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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique();
            $table->string('employee_code')->unique(); /// NIP

            // Personal Info
            $table->string('full_name');
            $table->string('email');
            $table->string('phone');
            $table->string('identity_number')->nullable(); // KTP or other ID
            $table->string('kk_number')->nullable(); // Kartu Keluarga
            $table->text('address')->nullable();
            $table->string('postal_code')->nullable();
            $table->date('birth_date');
            $table->enum('religion', ['Islam', 'Katolik', 'Kristen', 'Buddha', 'Hindu', 'Confucius', 'Others']);
            $table->enum('gender', [
                'MALE',
                'FEMALE',
            ]);
            $table->string('mothermaiden_name')->nullable();
            $table->enum('marital_status', [
                'SINGLE',
                'MARRIED',
                'WIDOW',
                'WIDOWER',
            ])->default('SINGLE');
            $table->string('spouse_name')->nullable();
            $table->string('spouse_phone')->nullable();
            $table->string('place_of_birth')->nullable();
            $table->string('last_education')->nullable();

            // Employment Info
            $table->date('join_date');
            $table->date('end_date')->nullable();
            $table->foreignId('position_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->nullable()->constrained('position_levels')->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('outsourcing_field_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('employment_status_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shift_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('employee_type_id')->constrained()->cascadeOnDelete();
            $table->string('approval_line')
                // Using employee_code as the approval line
                ->nullable();

            // Payroll Info
            $table->double('basic_salary')->default(0);

            // Additional Fields
            $table->string('photo_url')->nullable();
            $table->enum('status', ['active', 'inactive', 'on_leave', 'resigned'])->default('active');
            $table->string('resignation_reason')->nullable();
            $table->date('resignation_date')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
