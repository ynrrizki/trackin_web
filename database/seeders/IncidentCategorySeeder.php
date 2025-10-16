<?php

namespace Database\Seeders;

use App\Models\IncidentCategory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class IncidentCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Dummy Incident Categories for Security or Facility Management
        IncidentCategory::insert([
            ['name' => 'Listrik', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Air Bersih', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Jalan Rusak', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Kebakaran', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Kecelakaan', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Pencurian', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Vandalism', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Gangguan Keamanan', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Bencana Alam', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Lainnya', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
