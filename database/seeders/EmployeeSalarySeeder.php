<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\EmployeeBpjs;
use App\Models\EmployeeTaxStatus;
use App\Models\SalaryComponent;

class EmployeeSalarySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create salary components first
        $salaryComponents = [
            ['name' => 'Gaji Pokok', 'type' => 'base', 'component_type' => 'base'],
            ['name' => 'Tunjangan Makan', 'type' => 'allowance', 'component_type' => 'allowance'],
            ['name' => 'Tunjangan Transport', 'type' => 'allowance', 'component_type' => 'allowance'],
            ['name' => 'Tunjangan Komunikasi', 'type' => 'allowance', 'component_type' => 'allowance'],
            ['name' => 'Potongan Alpha', 'type' => 'deduction', 'component_type' => 'deduction'],
            ['name' => 'Potongan Keterlambatan', 'type' => 'deduction', 'component_type' => 'deduction'],
        ];

        foreach ($salaryComponents as $component) {
            SalaryComponent::firstOrCreate(
                ['name' => $component['name']],
                $component
            );
        }

        // Get all employees
        $employees = Employee::all();

        foreach ($employees as $index => $employee) {
            // Create base salary record
            $baseSalary = 5000000 + ($index * 500000); // Different salaries: 5M, 5.5M, 6M, etc.

            EmployeeSalary::firstOrCreate([
                'employee_id' => $employee->id,
                'is_active' => true,
            ], [
                'base_salary' => $baseSalary,
                'effective_date' => now()->subMonths(3),
                'created_by' => 1,
            ]);

            // Add salary components relationships
            $salary = EmployeeSalary::where('employee_id', $employee->id)
                ->where('is_active', true)
                ->first();

            if ($salary) {
                $components = [
                    'Tunjangan Makan' => 300000,
                    'Tunjangan Transport' => 500000,
                    'Tunjangan Komunikasi' => 200000,
                ];

                foreach ($components as $componentName => $amount) {
                    $component = SalaryComponent::where('name', $componentName)->first();
                    if ($component) {
                        $salary->salaryComponents()->syncWithoutDetaching([
                            $component->id => ['amount' => $amount]
                        ]);
                    }
                }
            }

            // Create BPJS record
            EmployeeBpjs::firstOrCreate([
                'employee_id' => $employee->id,
                'is_active' => true,
            ], [
                'bpjs_health_active' => true,
                'bpjs_employment_active' => true,
                'bpjs_health_number' => 'BPJS-HEALTH-' . str_pad($employee->id, 6, '0', STR_PAD_LEFT),
                'bpjs_employment_number' => 'BPJS-EMP-' . str_pad($employee->id, 6, '0', STR_PAD_LEFT),
                'effective_date' => now()->subMonths(3),
            ]);

            // Create tax status record
            $taxStatuses = ['TK/0', 'TK/1', 'K/0', 'K/1', 'K/2', 'K/3'];
            $ptkpAmounts = [
                'TK/0' => 54000000,  // Single, no dependents
                'TK/1' => 58500000,  // Single, 1 dependent
                'K/0' => 58500000,   // Married, no dependents
                'K/1' => 63000000,   // Married, 1 dependent
                'K/2' => 67500000,   // Married, 2 dependents
                'K/3' => 72000000,   // Married, 3 dependents
            ];

            $selectedStatus = $taxStatuses[$index % count($taxStatuses)];

            EmployeeTaxStatus::firstOrCreate([
                'employee_id' => $employee->id,
                'is_active' => true,
            ], [
                'ptkp_status' => $selectedStatus,
                'ptkp_amount' => $ptkpAmounts[$selectedStatus],
                'npwp_number' => 'NPWP-' . str_pad($employee->id, 10, '0', STR_PAD_LEFT),
                'effective_date' => now()->subMonths(3),
            ]);
        }

        $this->command->info('Employee salary components created successfully!');
    }
}
