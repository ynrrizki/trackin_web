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
        Schema::create('employee_tax_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->enum('ptkp_code', ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/1', 'K/2', 'K3'])->default('TK/0'); // PKP status
            $table->boolean('is_spouse_working')->default(false); // Whether the spouse is working
            $table->string('npwp')->nullable(); // NPWP number of the employee
            $table->enum('tax_method', ['GROSS', 'GROSS-UP', 'NETTO'])->nullable();
            $table->enum('tax_salary', ['TAXABLE', 'NON-TAXABLE'])->nullable();
            $table->enum('tax_status', [
                'Pegawai Tetap',
                'Pegawai Tidak Tetap',
                'Bukan Pegawai yang Bersifat Berkesinambungan',
                'Bukan Pegawai yang tidak Bersifat Berkesinambungan',
                'Ekspatriat',
                'Ekspatriat Dalam Negeri',
                'Tenaga Ahli yang Bersifat Berkesinambungan',
                'Tenaga Ahli yang Tidak Bersifat Berkesinambungan',
                'Dewan Komisaris',
                'Tenaga Ahli yang Bersifat Berkesinambungan >1 PK',
                'Tenaga Kerja Lepas',
                'Bukan Pegawai yang Bersifat Berkesinambungan >1 PK',
            ])->nullable();
            $table->enum('jht', ['NOT-PAID', 'PAID-BY-COMPANY', 'PAID-BY-EMPLOYEE', 'DEFAULT'])->nullable();
            $table->enum('jp', ['NOT-PAID', 'PAID-BY-COMPANY', 'PAID-BY-EMPLOYEE', 'DEFAULT'])->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_tax_statuses');
    }
};
