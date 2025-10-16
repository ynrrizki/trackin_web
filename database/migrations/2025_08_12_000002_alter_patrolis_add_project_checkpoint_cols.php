<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('patrolis', function (Blueprint $table) {
            if (!Schema::hasColumn('patrolis', 'project_id')) {
                $table->foreignId('project_id')->nullable()->after('employee_id')->constrained('client_projects')->nullOnDelete();
            }
            if (!Schema::hasColumn('patrolis', 'checkpoint_id')) {
                $table->foreignId('checkpoint_id')->nullable()->after('project_id')->constrained('patroli_checkpoints')->nullOnDelete();
            }
            if (!Schema::hasColumn('patrolis', 'latitude')) {
                $table->decimal('latitude', 10, 6)->nullable()->after('end_time');
            }
            if (!Schema::hasColumn('patrolis', 'longitude')) {
                $table->decimal('longitude', 10, 6)->nullable()->after('latitude');
            }
            if (!Schema::hasColumn('patrolis', 'status')) {
                $table->string('status')->default('in_progress')->after('note');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patrolis', function (Blueprint $table) {
            if (Schema::hasColumn('patrolis', 'checkpoint_id')) {
                $table->dropConstrainedForeignId('checkpoint_id');
            }
            if (Schema::hasColumn('patrolis', 'project_id')) {
                $table->dropConstrainedForeignId('project_id');
            }
            if (Schema::hasColumn('patrolis', 'latitude')) {
                $table->dropColumn('latitude');
            }
            if (Schema::hasColumn('patrolis', 'longitude')) {
                $table->dropColumn('longitude');
            }
            if (Schema::hasColumn('patrolis', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
