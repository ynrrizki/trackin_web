<?php

namespace Database\Seeders;

use App\Models\Shift;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Position;
use App\Models\PositionLevel;
use App\Models\Department;
use App\Models\EmploymentStatus;
use App\Models\EmployeeType;
use App\Models\OutsourcingField;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure default HO shift exists first
        \App\Models\Shift::firstOrCreate(
            ['name' => 'Staff Holding'],
            [
                'start_time' => '07:00:00',
                'end_time' => '17:00:00',
            ]
        );

        Shift::insert([
            // other HO shifts
            [
                'name' => 'Holding Pagi',
                'start_time' => '07:00:00',
                'end_time' => '15:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Holding Siang',
                'start_time' => '15:00:00',
                'end_time' => '23:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Holding Malam',
                'start_time' => '23:00:00',
                'end_time' => '07:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Bank Indonesia (Shift Pagi)',
                'start_time' => '07:00:00',
                'end_time' => '15:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Bank Indonesia (Shift Siang)',
                'start_time' => '15:00:00',
                'end_time' => '23:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Bank Indonesia (Shift Malam)',
                'start_time' => '23:00:00',
                'end_time' => '07:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Ensure employee types (for mapping positions)
        $baseTypes = [
            ['code' => 'INT', 'name' => 'Internal', 'description' => 'Internal employee', 'status' => 'active'],
            ['code' => 'OUT', 'name' => 'Outsourcing', 'description' => 'Outsourcing employee', 'status' => 'active'],
        ];
        foreach ($baseTypes as $t) {
            EmployeeType::updateOrCreate(
                ['code' => $t['code']],
                [
                    'name' => $t['name'],
                    'description' => $t['description'],
                    'status' => $t['status'],
                ]
            );
        }
        $internalTypeId = EmployeeType::where('code', 'INT')->value('id');
        $outsourcingTypeId = EmployeeType::where('code', 'OUT')->value('id');

        // Positions with employee_type reference (internal + outsourcing)
        $positions = [
            // Internal roles
            ['code' => 'DEV', 'name' => 'Developer', 'description' => 'Software Developer', 'status' => 'active', 'employee_type_id' => $internalTypeId],
            ['code' => 'MGR_HR', 'name' => 'Manager HR', 'description' => 'Penanggung jawab HR', 'status' => 'active', 'employee_type_id' => $internalTypeId],
            ['code' => 'MGR_OPS', 'name' => 'Manager Operasional', 'description' => 'Penanggung jawab operasional', 'status' => 'active', 'employee_type_id' => $internalTypeId],
            ['code' => 'MGR_MKT', 'name' => 'Manager Marketing', 'description' => 'Penanggung jawab Marketing', 'status' => 'active', 'employee_type_id' => $internalTypeId],
            ['code' => 'GM_OPS', 'name' => 'GM Operasional', 'description' => 'Penanggung jawab operasional', 'status' => 'active', 'employee_type_id' => $internalTypeId],
            ['code' => 'GM_HR', 'name' => 'GM HR', 'description' => 'Penanggung jawab HR', 'status' => 'active', 'employee_type_id' => $internalTypeId],
            ['code' => 'GM_MKT', 'name' => 'GM Marketing', 'description' => 'Penanggung jawab Marketing', 'status' => 'active', 'employee_type_id' => $internalTypeId],
            ['code' => 'DIR', 'name' => 'Director', 'description' => 'Direktur perusahaan', 'status' => 'active', 'employee_type_id' => $internalTypeId],
            ['code' => 'IT', 'name' => 'Staff IT', 'description' => 'Staff IT', 'status' => 'active', 'employee_type_id' => $internalTypeId],
            ['code' => 'ADM', 'name' => 'Admin Kantor', 'description' => 'Staff administrasi', 'status' => 'active', 'employee_type_id' => $internalTypeId],
            // Outsourcing roles
            ['code' => 'SEC', 'name' => 'Security Staff', 'description' => 'Security personnel responsible for site safety', 'status' => 'active', 'employee_type_id' => $outsourcingTypeId],
            ['code' => 'SEC_SPV', 'name' => 'Security Supervisor', 'description' => 'Security personnel responsible for site safety', 'status' => 'active', 'employee_type_id' => $outsourcingTypeId],
            ['code' => 'SEC_MGR', 'name' => 'Security Manager', 'description' => 'Security personnel responsible for site safety', 'status' => 'active', 'employee_type_id' => $outsourcingTypeId],
            ['code' => 'CSO', 'name' => 'OB', 'description' => 'Cleaning personnel responsible for site cleanliness', 'status' => 'active', 'employee_type_id' => $outsourcingTypeId],
        ];

        foreach ($positions as $p) {
            Position::updateOrCreate(
                ['code' => $p['code']],
                [
                    'name' => $p['name'],
                    'description' => $p['description'],
                    'status' => $p['status'],
                    'employee_type_id' => $p['employee_type_id'],
                ]
            );
        }

        // Position Levels (no generic Level 1 naming)
        $levels = [
            ['code' => 'STAFF', 'name' => 'Staff', 'order' => 1],
            ['code' => 'SPV', 'name' => 'Supervisor', 'order' => 2],
            ['code' => 'MGR', 'name' => 'Manager', 'order' => 3],
            ['code' => 'GM', 'name' => 'General Manager', 'order' => 4],
            ['code' => 'DIR', 'name' => 'Director', 'order' => 5],
        ];

        foreach ($levels as $level) {
            PositionLevel::updateOrCreate(
                ['code' => $level['code']],
                [
                    'name' => $level['name'],
                    'order' => $level['order'],
                ]
            );
        }

        // Departments
        $departments = [
            ['code' => 'IT', 'name' => 'Information Technology', 'description' => 'IT Department', 'status' => 'active'],
            ['code' => 'HR', 'name' => 'Human Resources', 'description' => 'HR Department', 'status' => 'active'],
            ['code' => 'FIN', 'name' => 'Finance', 'description' => 'Finance Department', 'status' => 'active'],
            ['code' => 'MKT', 'name' => 'Marketing', 'description' => 'Marketing Department', 'status' => 'active'],
            ['code' => 'OPS', 'name' => 'Operations', 'description' => 'Operations Department', 'status' => 'active'],
        ];

        foreach ($departments as $department) {
            Department::firstOrCreate(
                ['code' => $department['code']],
                $department
            );
        }

        // Employment Statuses
        $statuses = [
            ['name' => 'Permanent', 'description' => 'Permanent Employee', 'status' => 'active', 'code' => 'PERM'],
            ['name' => 'Contract', 'description' => 'Contract Employee', 'status' => 'active', 'code' => 'CONT'],
            ['name' => 'Intern', 'description' => 'Internship', 'status' => 'active', 'code' => 'INT'],
            ['name' => 'Probation', 'description' => 'Probation Period', 'status' => 'active', 'code' => 'PROB'],
        ];

        foreach ($statuses as $status) {
            EmploymentStatus::firstOrCreate(
                [
                    'name' => $status['name']
                ],
                $status
            );
        }

    // (Removed duplicate employee type seeding; handled above with INT/OUT.)

        // Outsourcing Fields
        $fields = [
            ['name' => 'Cleaning Service', 'description' => 'Cleaning and Maintenance', 'status' => 'active', 'code' => 'CSO'],
            ['name' => 'Security', 'description' => 'Security Services', 'status' => 'active', 'code' => 'SEC'],
        ];

        foreach ($fields as $field) {
            OutsourcingField::firstOrCreate(
                ['name' => $field['name']],
                $field
            );
        }
    }
}
