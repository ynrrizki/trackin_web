<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory()->count(1)->create();

        $this->call([
            RolePermissionSeeder::class,
            ApprovableTypeSeeder::class,
            ApproverLayerSeeder::class,
            EmployeeMasterSeeder::class,
                // MasterDataSeeder::class,
            EmployeeSeeder::class,
            UserTestingSeeder::class, // pindah ke sini agar ikut dibridging
            ClientSeeder::class,
            ClientProjectSeeder::class,
            PatroliCheckpointSeeder::class,
            BridgeEmployeeProjectSeeder::class, // setelah semua employees & projects siap
                // AttendanceSeeder::class,
            IncidentCategorySeeder::class,
            // IncidentSeeder::class,
            LeaveCategorySeeder::class,
        ]);


        $user = User::create([
            'name' => 'Admin',
            'email' => 'admin@wmindonesia.com',
            'password' => bcrypt('password'),
        ]);

        $user->assignRole('Super Admin');
    }
}
