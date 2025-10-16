<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Position;
use App\Models\PositionLevel;
use App\Models\EmploymentStatus;
use App\Models\EmployeeType;
use App\Models\OutsourcingField;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class UserTestingSeeder extends Seeder
{
    public function run(): void
    {
        // Only use roles that actually exist (avoid 'Staff IT' etc)
        $users = [
            ['name' => 'Sec Staff', 'email' => 'sec.staff@wmindonesia.com', 'role' => 'Security Staff', 'employee_code' => 'SEC001', 'position_code' => 'SEC', 'employment_status_code' => 'KONTRAK'],
            ['name' => 'Sec Supervisor', 'email' => 'sec.supervisor@wmindonesia.com', 'role' => 'Security Supervisor', 'employee_code' => 'SEC002', 'approval_line' => 'SEC001', 'position_code' => 'SEC_SPV', 'employment_status_code' => 'KONTRAK'],
            ['name' => 'Operational Manager', 'email' => 'ops.manager@wmindonesia.com', 'role' => 'Operational Manager', 'employee_code' => 'OPS001', 'position_code' => 'MGR_OPS', 'department_code' => 'OPS', 'employment_status_code' => 'TETAP'],
            ['name' => 'Internal Employee', 'email' => 'employee@wmindonesia.com', 'role' => 'Employee', 'employee_code' => 'EMP100', 'approval_line' => 'OPS001', 'position_code' => 'IT', 'department_code' => 'IT', 'employment_status_code' => 'TETAP'],
            ['name' => 'HR Manager', 'email' => 'hr.manager@wmindonesia.com', 'role' => 'HR Manager', 'employee_code' => 'HRM001', 'position_code' => 'MGR_HR', 'department_code' => 'HR', 'employment_status_code' => 'TETAP'],
        ];

        // Preload master data
        $positionsByCode = Position::whereIn('code', [
            'SEC',
            'SEC_SPV',
            'SEC_MGR',
            'MGR_OPS',
            'IT',
            'MGR_HR'
        ])->get()->keyBy('code');

        $departmentsByCode = \App\Models\Department::whereIn('code', [
            'OPS',
            'IT',
            'HR'
        ])->get()->keyBy('code');

        $levelsByCode = PositionLevel::whereIn('code', ['STAFF', 'SPV', 'MGR'])->get()->keyBy('code');

        // $employmentStatus = EmploymentStatus::whereIn('code', ['TETAP', 'KONTRAK', 'MAGANG'])
        //     ->orderByRaw(
        //         'FIELD(code,\'TETAP\',\'KONTRAK\',\'MAGANG\')'
        //     )
        //     ->first();
        // if (!$employmentStatus) {
        //     $employmentStatus = EmploymentStatus::updateOrCreate(
        //         ['code' => 'TETAP'],
        //         ['name' => 'Tetap', 'description' => 'Tetap', 'status' => 'active']
        //     );
        // }

        $employeeTypeInternal = EmployeeType::firstOrCreate(
            ['code' => 'INT'],
            ['name' => 'Internal', 'status' => 'active']
        );
        $employeeTypeOut = EmployeeType::firstOrCreate(
            ['code' => 'OUT'],
            ['name' => 'Outsourcing', 'status' => 'active']
        );

        $securityOutField = OutsourcingField::firstOrCreate(
            ['code' => 'SEC'],
            [
                'name' => 'Security',
                'description' => 'Security / Satpam outsourced field',
                'status' => 'active'
            ]
        );

        foreach ($users as $u) {
            $user = User::firstOrCreate([
                'email' => $u['email']
            ], [
                'name' => $u['name'],
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'remember_token' => Str::random(10),
            ]);

            if (Role::where('name', $u['role'])->exists() && !$user->hasRole($u['role'])) {
                $user->assignRole($u['role']);
            }
            if ($u['role'] === 'Operational Manager' && Role::where('name', 'Manager')->exists() && !$user->hasRole('Manager')) {
                $user->assignRole('Manager');
            }

            if (class_exists(Employee::class)) {
                $positionCode = $u['position_code'];
                $positionModel = $positionsByCode->get($positionCode) ?? Position::firstOrCreate(
                    ['code' => $positionCode],
                    ['name' => $u['role'], 'status' => 'active']
                );

                $levelCode = match (true) {
                    str_contains($positionCode, 'SEC_SPV') => 'SPV',
                    str_contains($positionCode, 'SEC_MGR') => 'MGR',
                    str_contains($positionCode, 'MGR_') => 'MGR',
                    default => 'STAFF',
                };
                $levelModel = $levelsByCode->get($levelCode) ?? PositionLevel::updateOrCreate(
                    ['code' => $levelCode],
                    [
                        'name' => $levelCode === 'SPV' ? 'Supervisor' : ($levelCode === 'MGR' ? 'Manager' : 'Staff'),
                        'order' => $levelCode === 'SPV' ? 2 : ($levelCode === 'MGR' ? 3 : 1)
                    ]
                );

                $isSecurity = in_array($positionCode, ['SEC', 'SEC_SPV', 'SEC_MGR']);
                $employeeType = $isSecurity ? $employeeTypeOut : $employeeTypeInternal;

                $emp = Employee::updateOrCreate([
                    'employee_code' => $u['employee_code'],
                ], [
                    'user_id' => $user->id,
                    'full_name' => $u['name'],
                    'email' => $u['email'],
                    'phone' => '081234567890',
                    'birth_date' => now()->subYears(25)->toDateString(),
                    'religion' => 'Islam',
                    'gender' => 'MALE',
                    'join_date' => now()->toDateString(),
                    'position_id' => $positionModel->id,
                    'level_id' => $levelModel->id,
                    'department_id' => isset($u['department_code']) && $departmentsByCode->has($u['department_code']) ? $departmentsByCode->get($u['department_code'])->id : null,
                    // 'employment_status_id' => $employmentStatus->id,
                    // 'employment_status_id' => isset($u['employment_status_code']) ? (EmploymentStatus::firstOrCreate(
                    //     ['code' => $u['employment_status_code']],
                    //     ['name' => $u['employment_status_code'], 'description' => $u['employment_status_code'], 'status' => 'active']
                    // ))->id : $employmentStatus->id,
                    'employee_type_id' => $employeeType->id,
                    'outsourcing_field_id' => $isSecurity ? $securityOutField->id : null,
                    'status' => 'active',
                    'employment_status_id' => isset($u['employment_status_code']) ? (EmploymentStatus::firstOrCreate(
                        ['code' => $u['employment_status_code']],
                        ['name' => $u['employment_status_code'], 'description' => $u['employment_status_code'], 'status' => 'active']
                    ))->id : null,
                    'approval_line' => $u['approval_line'] ?? null,
                ]);

                if (($u['approval_line'] ?? null) && $emp->approval_line !== $u['approval_line']) {
                    $emp->approval_line = $u['approval_line'];
                    $emp->save();
                }
            }
        }
    }
}
