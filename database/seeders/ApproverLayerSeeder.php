<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ApprovableType;
use App\Models\ApproverLayer;
use App\Models\Employee;
use Spatie\Permission\Models\Role;

class ApproverLayerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure approvable types exist
        $types = ApprovableType::pluck('id', 'model_class');
        if ($types->isEmpty()) {
            $this->call(\Database\Seeders\ApprovableTypeSeeder::class);
            $types = ApprovableType::pluck('id', 'model_class');
        }

        // Helper to upsert layer
        $ensureLayer = function (int $approvableTypeId, int $level, string $approverType, int $approverId, string $description = null) {
            ApproverLayer::updateOrCreate(
                [
                    'approvable_type_id' => $approvableTypeId,
                    'level' => $level,
                ],
                [
                    'approver_type' => $approverType,
                    'approver_id' => $approverId,
                    'status' => 'active',
                    'description' => $description,
                ]
            );
        };

    // Common roles (L2 may still be HR Manager)
    $hrManagerRole = Role::where('name', 'HR Manager')->first();

        // Fallback to first active employee's user for demo if role missing
        // $firstEmployeeUserId = optional(Employee::with('user')->whereHas('user')->first())->user->id;

        // LeaveRequest flow: Approval Line (L1) -> HR Manager (L2)
        if ($types->has('App\\Models\\LeaveRequest')) {
            $typeId = $types['App\\Models\\LeaveRequest'];

            // Level 1 uses dynamic approval_line resolution; approver_id can be 0
            $ensureLayer($typeId, 1, 'approval_line', 0, 'Atasan langsung (Approval Line)');
            // elseif ($firstEmployeeUserId) {
            //     // Fallback demo to a user if no role seeded
            //     $ensureLayer($typeId, 1, \App\Models\User::class, $firstEmployeeUserId, 'Fallback approver');
            // }

            if ($hrManagerRole) {
                $ensureLayer($typeId, 2, Role::class, $hrManagerRole->id, 'HR final approval');
            }
        }

        // Overtime flow: Approval Line (L1) -> HR Manager (L2)
        if ($types->has('App\\Models\\Overtime')) {
            $typeId = $types['App\\Models\\Overtime'];

            // Level 1 uses dynamic approval_line resolution; approver_id can be 0
            $ensureLayer($typeId, 1, 'approval_line', 0, 'Atasan langsung (Approval Line)');
            // elseif ($firstEmployeeUserId) {
            //     $ensureLayer($typeId, 1, \App\Models\User::class, $firstEmployeeUserId, 'Fallback approver');
            // }

            if ($hrManagerRole) {
                $ensureLayer($typeId, 2, Role::class, $hrManagerRole->id, 'HR final approval');
            }
        }
    }
}
