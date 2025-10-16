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
        Schema::create('client_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete(); // Foreign key to clients table
            $table->foreignId('outsourcing_field_id')->nullable()->constrained('outsourcing_fields')->cascadeOnDelete(); // Foreign key to outsourcing fields table
            $table->string('code')->unique(); // Unique code for client invoices
            $table->string('name');
            $table->string('contact_person')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('latitude')->nullable();
            $table->string('longitude')->nullable();
            $table->integer('required_agents')->default(1); // Jumlah agent outsource yang dibutuhkan
            $table->enum('status', [
                'tender', // Tender/proposal stage
                'won', // Tender won, project active
                'lost', // Tender lost
                'cancelled' // Tender cancelled
            ])->default('tender')->index(); // Status of the tender/proposal
            $table->datetime('contract_start')->nullable(); // Start date of the contract
            $table->datetime('contract_end')->nullable()->index(); // End date of the contract
            $table->decimal('hourly_rate', 15, 2)->nullable(); // Rate per jam
            $table->decimal('monthly_rate', 15, 2)->nullable(); // Rate bulanan
            $table->text('special_requirements')->nullable(); // Requirements khusus (seragam, sertifikat, dll)
            $table->text('notes')->nullable(); // Additional notes about the client
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_projects');
    }
};
