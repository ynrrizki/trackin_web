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
        Schema::create('employee_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->string('name'); // e.g. Bank Mandiri, BCA
            $table->string('account_number');
            $table->string('account_name'); // Name on the bank account
            $table->string('bank_code')->nullable(); // Optional bank code (e.g. for international transfers)
            $table->string('bank_branch')->nullable(); // Optional branch name or code
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_bank_accounts');
    }
};
