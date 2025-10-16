<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Factories\Sequence;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        // 1) Director (top approver) with fixed code
        $director = Employee::factory()
            ->director()
            ->create([
                // 'user_id' => 1,
                'employee_code' => 'EMP-001',
                'approval_line' => null,
                // 'photo_url' => 'https://placehold.co/150',
                'photo_url' => null,
                'full_name' => 'Jogyo',
                'email' => 'jogyo@wmindonesia.com',
                'employee_type_id' => 1, // pastikan direktur adalah internal
            ]);

        // Helper to generate random EMP code for others
        // $uniqueCode = fn() => 'EMP' . Str::padLeft((string) rand(2, 9999), 4, '0');
        $uniqueCode = function (string $prefix = 'EMP') {
            $tries = 0;
            do {
                $code = Employee::generateUniqueCode($prefix, pad: 3);
                // Soft pre-check agar minim bentrok
                if (!Employee::where('employee_code', $code)->exists()) {
                    return $code;
                }
            } while (++$tries < 10);
            // fallback terakhir—tetap kembalikan kode; DB unique akan jaga integritas
            return Employee::generateUniqueCode($prefix, pad: 3);
        };


        // // 2) Managers in OPS, HR, MKT
        // $managerOPS = Employee::factory()->manager('OPS')->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => 'EMP-001',
        //     'photo_url' => 'https://placehold.co/150',
        // ]);
        // $managerHR = Employee::factory()->manager('HR')->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => 'EMP-001',
        //     'photo_url' => 'https://placehold.co/150',
        // ]);

        // $marketing = Employee::factory()->manager('MKT')->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => 'EMP-001',
        //     'photo_url' => 'https://placehold.co/150',
        // ]);

        // // 3) Staff IT (2 orang)
        // $staffIT1 = Employee::factory()->staffIT()->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => 'EMP-001',
        //     'photo_url' => 'https://placehold.co/150',
        // ]);
        // $staffIT2 = Employee::factory()->staffIT()->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => 'EMP-001',
        //     'photo_url' => 'https://placehold.co/150',
        // ]);

        // // 4) Staff Admin (2 orang)
        // $staffADM1 = Employee::factory()->staffADM()->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => 'EMP-001',
        //     'photo_url' => 'https://placehold.co/150',
        // ]);
        // $staffADM2 = Employee::factory()->staffADM()->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => 'EMP-001',
        //     'photo_url' => 'https://placehold.co/150',
        // ]);

        // // Security Supervisor & Manager
        // $secSpv = Employee::factory()->outsourceSecuritySupervisor()->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => 'EMP-001',
        //     'photo_url' => 'https://placehold.co/150',
        // ]);
        // $secSManager = Employee::factory()->outsourceSecurityManager()->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => 'EMP-001',
        //     'photo_url' => 'https://placehold.co/150',
        // ]);

        // // 5) Outsourcing (SEC & CSO)
        // $sec = Employee::factory()->outsource('SEC')->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => $secSpv->employee_code,
        //     'photo_url' => 'https://placehold.co/150',
        // ]);
        // $cso = Employee::factory()->outsource('CSO')->create([
        //     'employee_code' => $uniqueCode(),
        //     'approval_line' => $managerOPS->employee_code,
        //     'photo_url' => 'https://placehold.co/150',
        // ]);
    }
}
