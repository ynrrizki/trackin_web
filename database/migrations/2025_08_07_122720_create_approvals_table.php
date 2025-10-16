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
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('approver_layer_id')->nullable();
            $table->morphs('approvable'); // This will create approvable_id and approvable_type columns like Employee, Position, etc.
            $table->morphs('approver'); // This will create approver_id and approver_type columns like Manager, HR, etc.
            $table->morphs('sender'); // This will create sender_id and sender_type columns like Staff, personil, etc.
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending'); // Status of the approval
            $table->date('due_date')->nullable(); // Optional due date for the approval
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
