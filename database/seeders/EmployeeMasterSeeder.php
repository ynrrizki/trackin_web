<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Position;
use App\Models\Department;
use App\Models\Shift;
use App\Models\PositionLevel;
use App\Models\EmploymentStatus;
use App\Models\EmployeeType;
use App\Models\OutsourcingField;
use Illuminate\Support\Facades\DB;

class EmployeeMasterSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure employee types exist first (idempotent)
        $employeeTypes = [
            ['code' => 'INT', 'name' => 'Internal', 'description' => 'Karyawan tetap perusahaan'],
            ['code' => 'OUT', 'name' => 'Outsourcing', 'description' => 'Karyawan projek'],
        ];

        foreach ($employeeTypes as $t) {
            EmployeeType::updateOrCreate(
                ['code' => $t['code']],
                [
                    'name' => $t['name'],
                    'description' => $t['description'],
                    'status' => 'active',
                ]
            );
        }

        $internalTypeId = EmployeeType::where('code', 'INT')->value('id');
        $outsourcingTypeId = EmployeeType::where('code', 'OUT')->value('id');

        // Positions with employee_type mapping (default internal)
        $positions = [
            ['name' => 'Security Staff', 'code' => 'SEC', 'description' => 'Security personnel responsible for site safety', 'employee_type_id' => $outsourcingTypeId],
            ['name' => 'Security Supervisor', 'code' => 'SEC_SPV', 'description' => 'Security personnel responsible for site safety', 'employee_type_id' => $outsourcingTypeId],
            ['name' => 'Security Manager', 'code' => 'SEC_MGR', 'description' => 'Security personnel responsible for site safety', 'employee_type_id' => $outsourcingTypeId],
            ['name' => 'OB', 'code' => 'CSO', 'description' => 'Cleaning personnel responsible for site cleanliness', 'employee_type_id' => $outsourcingTypeId],
            ['name' => 'Staff IT', 'code' => 'IT', 'description' => 'Staff IT', 'employee_type_id' => $internalTypeId],
            ['name' => 'Admin Kantor', 'code' => 'ADM', 'description' => 'Staff administrasi', 'employee_type_id' => $internalTypeId],
            ['name' => 'Manager Operasional', 'code' => 'MGR_OPS', 'description' => 'Penanggung jawab operasional', 'employee_type_id' => $internalTypeId],
            ['name' => 'Manager HR', 'code' => 'MGR_HR', 'description' => 'Penanggung jawab HR', 'employee_type_id' => $internalTypeId],
            ['name' => 'Manager Marketing', 'code' => 'MGR_MKT', 'description' => 'Penanggung jawab Marketing', 'employee_type_id' => $internalTypeId],
            ['name' => 'GM Operasional', 'code' => 'GM_OPS', 'description' => 'Penanggung jawab operasional', 'employee_type_id' => $internalTypeId],
            ['name' => 'GM HR', 'code' => 'GM_HR', 'description' => 'Penanggung jawab HR', 'employee_type_id' => $internalTypeId],
            ['name' => 'GM Marketing', 'code' => 'GM_MKT', 'description' => 'Penanggung jawab Marketing', 'employee_type_id' => $internalTypeId],
            ['name' => 'Director', 'code' => 'DIR', 'description' => 'Direktur perusahaan', 'employee_type_id' => $internalTypeId],
        ];

        foreach ($positions as $p) {
            Position::updateOrCreate(
                ['code' => $p['code']],
                [
                    'name' => $p['name'],
                    'description' => $p['description'],
                    'employee_type_id' => $p['employee_type_id'],
                    'status' => 'active',
                ]
            );
        }

        // Departments (idempotent)
        $departments = [
            ['name' => 'Information Technology', 'code' => 'IT'],
            ['name' => 'Operasional', 'code' => 'OPS'],
            ['name' => 'Human Resources', 'code' => 'HR'],
            ['name' => 'Marketing', 'code' => 'MKT'],
        ];
        foreach ($departments as $d) {
            Department::updateOrCreate(
                ['code' => $d['code']],
                [
                    'name' => $d['name'],
                ]
            );
        }

        // Shifts (idempotent by name)
        $shifts = [
            ['name' => 'Staff Holding', 'start_time' => '07:00:00', 'end_time' => '17:00:00'],
            ['name' => 'Holding Pagi', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
            ['name' => 'Holding Siang', 'start_time' => '15:00:00', 'end_time' => '23:00:00'],
            ['name' => 'Holding Malam', 'start_time' => '23:00:00', 'end_time' => '07:00:00'],
            ['name' => 'Bank Indonesia (Shift Pagi)', 'start_time' => '07:00:00', 'end_time' => '15:00:00'],
            ['name' => 'Bank Indonesia (Shift Siang)', 'start_time' => '15:00:00', 'end_time' => '23:00:00'],
            ['name' => 'Bank Indonesia (Shift Malam)', 'start_time' => '23:00:00', 'end_time' => '07:00:00'],
        ];
        foreach ($shifts as $s) {
            Shift::updateOrCreate(
                ['name' => $s['name']],
                [
                    'start_time' => $s['start_time'],
                    'end_time' => $s['end_time'],
                ]
            );
        }

        // Position Levels
        $levels = [
            ['name' => 'Staff', 'code' => 'STAFF', 'order' => 1],
            ['name' => 'Supervisor', 'code' => 'SPV', 'order' => 2],
            ['name' => 'Manager', 'code' => 'MGR', 'order' => 3],
            ['name' => 'General Manager', 'code' => 'GM', 'order' => 4],
            ['name' => 'Director', 'code' => 'DIR', 'order' => 5],
        ];
        foreach ($levels as $l) {
            PositionLevel::updateOrCreate(
                ['code' => $l['code']],
                [
                    'name' => $l['name'],
                    'order' => $l['order'],
                ]
            );
        }

        // Employment Statuses
        $employmentStatuses = [
            ['name' => 'Tetap', 'code' => 'TETAP'],
            ['name' => 'Kontrak', 'code' => 'KONTRAK'],
            ['name' => 'Magang', 'code' => 'MAGANG'],
        ];
        foreach ($employmentStatuses as $es) {
            EmploymentStatus::updateOrCreate(
                ['code' => $es['code']],
                [
                    'name' => $es['name'],
                ]
            );
        }

    // Employee types already seeded above (removed duplicate insert)

        // Outsourcing Fields
        $outsourcingFields = [
            ['name' => 'Security', 'code' => 'SEC', 'description' => 'Keamanan'],
            ['name' => 'Cleaning Service', 'code' => 'CSO', 'description' => 'Kebersihan'],
        ];
        foreach ($outsourcingFields as $of) {
            OutsourcingField::updateOrCreate(
                ['code' => $of['code']],
                [
                    'name' => $of['name'],
                    'description' => $of['description'],
                ]
            );
        }
    }
}
