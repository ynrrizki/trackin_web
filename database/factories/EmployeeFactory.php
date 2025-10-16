<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Position;
use App\Models\PositionLevel;
use App\Models\EmploymentStatus;
use App\Models\EmployeeType;
use App\Models\OutsourcingField;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Mapping code -> id dari master data yang sudah disediakan oleh seeder
        $codeMaps = [
            'positions' => Position::pluck('id', 'code')->all(),
            'levels' => PositionLevel::pluck('id', 'code')->all(),
            'departments' => Department::pluck('id', 'code')->all(),
            'employment' => EmploymentStatus::pluck('id', 'code')->all(),
            'types' => EmployeeType::pluck('id', 'code')->all(),
            'outsourcing' => OutsourcingField::pluck('id', 'code')->all(),
        ];

        // Kurasi daftar pekerjaan dummy yang konsisten dengan posisi/level/departemen/status/type
        $dummyJobs = [
            // Top management
            [
                'position' => 'DIR',
                'level' => 'DIR',
                'department' => null,
                'employment' => 'TETAP',
                'type' => 'INT',
                'outsourcing' => null,
            ],
            // General Managers
            [
                'position' => 'GM_OPS',
                'level' => 'GM',
                'department' => 'OPS',
                'employment' => 'TETAP',
                'type' => 'INT',
                'outsourcing' => null,
            ],
            [
                'position' => 'GM_HR',
                'level' => 'GM',
                'department' => 'HR',
                'employment' => 'TETAP',
                'type' => 'INT',
                'outsourcing' => null,
            ],
            [
                'position' => 'GM_MKT',
                'level' => 'GM',
                'department' => 'MKT',
                'employment' => 'TETAP',
                'type' => 'INT',
                'outsourcing' => null,
            ],
            // Managers
            [
                'position' => 'MGR_OPS',
                'level' => 'MGR',
                'department' => 'OPS',
                'employment' => 'TETAP',
                'type' => 'INT',
                'outsourcing' => null,
            ],
            [
                'position' => 'MGR_HR',
                'level' => 'MGR',
                'department' => 'HR',
                'employment' => 'TETAP',
                'type' => 'INT',
                'outsourcing' => null,
            ],
            [
                'position' => 'MGR_MKT',
                'level' => 'MGR',
                'department' => 'MKT',
                'employment' => 'KONTRAK',
                'type' => 'INT',
                'outsourcing' => null,
            ],
            // Staffs
            [
                'position' => 'IT',
                'level' => 'STAFF',
                'department' => 'IT',
                'employment' => 'TETAP',
                'type' => 'INT',
                'outsourcing' => null,
            ],
            [
                'position' => 'ADM',
                'level' => 'STAFF',
                'department' => 'OPS',
                'employment' => 'KONTRAK',
                'type' => 'INT',
                'outsourcing' => null,
            ],
            [
                'position' => 'IT',
                'level' => 'STAFF',
                'department' => 'IT',
                'employment' => 'MAGANG',
                'type' => 'INT',
                'outsourcing' => null,
            ],
            // Outsourcing roles - Security with levels (Staff/SPV/MGR)
            [
                'position' => 'SEC',
                'level' => 'STAFF',
                'department' => null,
                'employment' => 'KONTRAK',
                'type' => 'OUT',
                'outsourcing' => 'SEC',
            ],
            [
                'position' => 'SEC_SPV',
                'level' => 'SPV',
                'department' => null,
                'employment' => 'KONTRAK',
                'type' => 'OUT',
                'outsourcing' => 'SEC',
            ],
            [
                'position' => 'SEC_MGR',
                'level' => 'MGR',
                'department' => null,
                'employment' => 'KONTRAK',
                'type' => 'OUT',
                'outsourcing' => 'SEC',
            ],
            // Outsourcing roles - CSO is OB at Staff level
            [
                'position' => 'CSO',
                'level' => 'STAFF',
                'department' => null,
                'employment' => 'KONTRAK',
                'type' => 'OUT',
                'outsourcing' => 'CSO',
            ],
        ];

        // Pilih salah satu skenario pekerjaan secara acak dari daftar kurasi
        $job = $dummyJobs[array_rand($dummyJobs)];

        // Helper untuk translate code -> id (aman bila tidak ditemukan)
        $resolve = function (?string $group, ?string $code) use ($codeMaps) {
            if ($group === null || $code === null)
                return null;
            return $codeMaps[$group][$code] ?? null;
        };

        $positionId = $resolve('positions', $job['position'] ?? null);
        $levelId = $resolve('levels', $job['level'] ?? null);
        $departmentId = $resolve('departments', $job['department'] ?? null);
        $employmentStatusId = $resolve('employment', $job['employment'] ?? null);
        $employeeTypeId = $resolve('types', $job['type'] ?? null);
        $outsourcingFieldId = $resolve('outsourcing', code: $job['outsourcing'] ?? null);

        // Build a short label for the role to append to the name
        $positionNames = Position::pluck('name', 'code')->all();
        $departmentNames = Department::pluck('name', 'code')->all();
        $outsourcingNames = OutsourcingField::pluck('name', 'code')->all();
        $roleParts = [];
        $posCode = $job['position'] ?? null;
        $deptCode = $job['department'] ?? null;
        $outCode = $job['outsourcing'] ?? null;
        if (is_string($posCode) && isset($positionNames[$posCode])) {
            $roleParts[] = $positionNames[$posCode];
        } elseif (is_string($outCode) && isset($outsourcingNames[$outCode])) {
            $roleParts[] = 'Outsourcing ' . $outsourcingNames[$outCode];
        }
        if (is_string($deptCode) && isset($departmentNames[$deptCode])) {
            $roleParts[] = $departmentNames[$deptCode];
        }
        $roleLabel = count($roleParts) ? implode(' - ', $roleParts) : null;
        $name = $this->faker->name();
        return [
            'full_name' => $name,
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'birth_date' => $this->faker->date('Y-m-d', '-20 years'),
            'join_date' => $this->faker->date('Y-m-d', '-2 years'),
            'address' => $this->faker->address(),
            'position_id' => $positionId,
            'level_id' => $levelId,
            'department_id' => $departmentId,
            'employment_status_id' => $employmentStatusId,
            'shift_id' => rand(1, 7),
            'employee_type_id' => $employeeTypeId,
            'outsourcing_field_id' => $outsourcingFieldId,
            'approval_line' => 'EMP-001',
            'status' => 'active',
            'religion' => $this->faker->randomElement(['Islam', 'Katolik', 'Kristen', 'Buddha', 'Hindu', 'Confucius', 'Others']),
            'photo_url' => 'https://placehold.co/150',
            'gender' => $this->faker->randomElement(['MALE', 'FEMALE'])
        ];
    }

    /**
     * Convenience: translate codes to IDs once.
     */
    protected function mapCodesToIds(array $job): array
    {
        $maps = [
            'positions' => Position::pluck('id', 'code')->all(),
            'levels' => PositionLevel::pluck('id', 'code')->all(),
            'departments' => Department::pluck('id', 'code')->all(),
            'employment' => EmploymentStatus::pluck('id', 'code')->all(),
            'types' => EmployeeType::pluck('id', 'code')->all(),
            'outsourcing' => OutsourcingField::pluck('id', 'code')->all(),
        ];
        $get = fn($group, $code) => $code ? ($maps[$group][$code] ?? null) : null;

        return [
            'position_id' => $get('positions', $job['position'] ?? null),
            'level_id' => $get('levels', $job['level'] ?? null),
            'department_id' => $get('departments', $job['department'] ?? null),
            'employment_status_id' => $get('employment', $job['employment'] ?? null),
            'employee_type_id' => $get('types', $job['type'] ?? null),
            'outsourcing_field_id' => $get('outsourcing', $job['outsourcing'] ?? null),
        ];
    }

    // States
    public function director(): static
    {
        $job = [
            'position' => 'DIR',
            'level' => 'DIR',
            'department' => null,
            'employment' => 'TETAP',
            'type' => 'INT',
            'outsourcing' => null,
        ];
        $ids = $this->mapCodesToIds($job);
        return $this->state(fn() => $ids + ['approval_line' => null]);
    }

    public function gm(string $deptCode): static
    {
        $job = [
            'position' => 'GM_' . strtoupper($deptCode),
            'level' => 'GM',
            'department' => strtoupper($deptCode),
            'employment' => 'TETAP',
            'type' => 'INT',
            'outsourcing' => null,
        ];
        $ids = $this->mapCodesToIds($job);
        return $this->state(fn() => $ids);
    }

    public function manager(string $deptCode): static
    {
        $job = [
            'position' => 'MGR_' . strtoupper($deptCode),
            'level' => 'MGR',
            'department' => strtoupper($deptCode),
            'employment' => 'TETAP',
            'type' => 'INT',
            'outsourcing' => null,
        ];
        $ids = $this->mapCodesToIds($job);
        return $this->state(fn() => $ids);
    }

    public function staffIT(): static
    {
        $job = [
            'position' => 'IT',
            'level' => 'STAFF',
            'department' => 'IT',
            'employment' => 'TETAP',
            'type' => 'INT',
            'outsourcing' => null,
        ];
        $ids = $this->mapCodesToIds($job);
        return $this->state(fn() => $ids);
    }

    public function staffADM(): static
    {
        $job = [
            'position' => 'ADM',
            'level' => 'STAFF',
            'department' => 'OPS',
            'employment' => 'KONTRAK',
            'type' => 'INT',
            'outsourcing' => null,
        ];
        $ids = $this->mapCodesToIds($job);
        return $this->state(fn() => $ids);
    }

    public function outsource(string $fieldCode): static
    {
        $fieldCode = strtoupper($fieldCode);
        // Default CSO as OB/STAFF, Security default to Staff
        $job = match ($fieldCode) {
            'SEC' => [
                'position' => 'SEC',
                'level' => 'STAFF',
                'department' => null,
                'employment' => 'KONTRAK',
                'type' => 'OUT',
                'outsourcing' => 'SEC',
            ],
            'CSO' => [
                'position' => 'CSO',
                'level' => 'STAFF',
                'department' => null,
                'employment' => 'KONTRAK',
                'type' => 'OUT',
                'outsourcing' => 'CSO',
            ],
            default => [
                'position' => 'CSO',
                'level' => 'STAFF',
                'department' => null,
                'employment' => 'KONTRAK',
                'type' => 'OUT',
                'outsourcing' => $fieldCode,
            ],
        };
        $ids = $this->mapCodesToIds($job);
        return $this->state(fn() => $ids);
    }

    public function outsourceSecurityStaff(): static
    {
        return $this->outsource('SEC')->state(fn() => $this->mapCodesToIds([
            'position' => 'SEC',
            'level' => 'STAFF',
            'department' => null,
            'employment' => 'KONTRAK',
            'type' => 'OUT',
            'outsourcing' => 'SEC',
        ]));
    }

    public function outsourceSecuritySupervisor(): static
    {
        $ids = $this->mapCodesToIds([
            'position' => 'SEC_SPV',
            'level' => 'SPV',
            'department' => null,
            'employment' => 'KONTRAK',
            'type' => 'OUT',
            'outsourcing' => 'SEC',
        ]);
        return $this->state(fn() => $ids);
    }

    public function outsourceSecurityManager(): static
    {
        $ids = $this->mapCodesToIds([
            'position' => 'SEC_MGR',
            'level' => 'MGR',
            'department' => null,
            'employment' => 'KONTRAK',
            'type' => 'OUT',
            'outsourcing' => 'SEC',
        ]);
        return $this->state(fn() => $ids);
    }

    public function outsourceCSO(): static
    {
        return $this->outsource('CSO');
    }
}
