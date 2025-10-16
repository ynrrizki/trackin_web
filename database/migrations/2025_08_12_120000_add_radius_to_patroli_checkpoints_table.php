<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // If running older deployments without radius_m this will add it.
        // For fresh installations the column is already present in the create migration and this is a no-op.
        Schema::table('patroli_checkpoints', function (Blueprint $table) {
            if (!Schema::hasColumn('patroli_checkpoints', 'radius_m')) {
                $table->unsignedInteger('radius_m')->default(25)->after('longitude');
            }
        });
    }
    public function down(): void
    {
        Schema::table('patroli_checkpoints', function (Blueprint $table) {
            if (Schema::hasColumn('patroli_checkpoints', 'radius_m')) {
                $table->dropColumn('radius_m');
            }
        });
    }
};
