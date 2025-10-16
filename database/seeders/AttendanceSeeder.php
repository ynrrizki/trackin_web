<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Database\Seeder;

class AttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create('id_ID');
        $employees = Employee::all();

        foreach ($employees as $employee) {
            for ($i = 0; $i < 7; $i++) {
                Attendance::create([
                    'employee_id' => $employee->id,
                    'date' => now()->subDays($i)->toDateString(),
                    'time_in' => $faker->time('H:i:s'),
                    'time_out' => $faker->time('H:i:s'),
                    'latlot_in' => $faker->latitude(-6.3, -6.1) . ',' . $faker->longitude(106.7, 107),
                    'latlot_out' => $faker->latitude(-6.3, -6.1) . ',' . $faker->longitude(106.7, 107),
                    'is_fake_map_detected' => $faker->boolean(5), // 5% kemungkinan palsu
                ]);
            }
        }
    }
}
