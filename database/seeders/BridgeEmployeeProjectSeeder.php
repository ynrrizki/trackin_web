<?php

namespace Database\Seeders;

use App\Models\ClientProject;
use App\Models\Employee;
use App\Models\EmployeeProject;
use Illuminate\Database\Seeder;

class BridgeEmployeeProjectSeeder extends Seeder
{
    public function run(): void
    {
        // Only outsourcing employees (exclude internal staff)
        $employees = Employee::active()->whereNotNull('outsourcing_field_id')->take(20)->get();
        $projects = ClientProject::take(5)->get();
        if ($employees->isEmpty() || $projects->isEmpty()) {
            return; // prerequisites required
        }

        // Distribute outsourcing employees round-robin across available projects
        $projectCount = $projects->count();
        foreach ($employees as $idx => $emp) {
            $project = $projects[$idx % $projectCount];
            EmployeeProject::firstOrCreate([
                'employee_id' => $emp->id,
                'project_id' => $project->id,
            ]);
        }
    }
}
