<?php

namespace App;

use App\Models\Approval;
use App\Models\ApprovableType;
use App\Models\ApproverLayer;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

/**
 * Mixin to create the first approval(s) in a layered flow based on ApproverLayer config
 */
trait CreatesApprovalFlow
{
    /**
     * Create ALL first-level approvals for this approvable model.
     * - Supports multiple approvers on the first level (parallel)
     * - Stores approver_layer_id on each Approval
     */
    public function createApprovalFlow(string $approval_line = null): void
    {
        $modelClass = get_class($this);
        $type = ApprovableType::where('model_class', $modelClass)->first();
        if (!$type)
            return;

        $layers = $type->activeApproverLayers()->orderBy('level')->get();
        if ($layers->isEmpty())
            return;

        $sender = Auth::user();
        if (!$sender)
            return;

        $firstLevel = (int) $layers->min('level');
        $firstLevelLayers = $layers->where('level', $firstLevel);

        DB::transaction(function () use ($firstLevelLayers, $sender, $modelClass, $approval_line, $type) {
            foreach ($firstLevelLayers as $layer) {
                $approverUserId = $this->resolveApproverUserIdFromLayer($layer, $approval_line);
                if (!$approverUserId) {
                    continue; // no eligible approver for this layer
                }

                // Prevent duplicate pending approval for same approver & layer
                $exists = Approval::where('approvable_type', $modelClass)
                    ->where('approvable_id', $this->getKey())
                    ->where('approver_layer_id', $layer->id)
                    ->where('approver_id', $approverUserId)
                    ->where('status', 'pending')
                    ->exists();

                if ($exists)
                    continue;

                Approval::create([
                    'name' => $type->display_name . ' Approval',
                    'approvable_id' => $this->getKey(),
                    'approvable_type' => $modelClass,
                    'approver_layer_id' => $layer->id,          // ⬅️ penting
                    'status' => 'pending',
                    'approver_id' => $approverUserId,
                    'approver_type' => User::class,
                    'sender_id' => $sender->id,
                    'sender_type' => get_class($sender),
                ]);
            }
        });
    }

    /**
     * Resolve approver (User id) from a given ApproverLayer config.
     * Mirrors logic in Approval::resolveApproverUserId
     */
    protected function resolveApproverUserIdFromLayer(ApproverLayer $layer, ?string $explicitApprovalLine): ?int
    {
        // 1) Virtual type: 'approval_line' (employee.approval_line -> manager employee_code)
        if ($layer->approver_type === 'approval_line') {
            // priority: explicit arg → requester.employee.approval_line
            $line = $explicitApprovalLine ?? optional($this->resolveRequesterEmployee())->approval_line;
            if ($line) {
                $manager = Employee::where('employee_code', $line)->with('user')->first();
                return $manager?->user?->id;
            }
            return null;
        }

        // 2) Role (Spatie) - special-case "manager" to requester approval_line, else first user with role
        if ($layer->approver_type === Role::class || $layer->approver_type === 'Spatie\\Permission\\Models\\Role' || $layer->approver_type === 'App\\Models\\Role') {
            $role = Role::find($layer->approver_id);
            if (!$role)
                return null;

            if (strtolower($role->name) === 'manager') {
                $employee = $this->resolveRequesterEmployee();
                if ($employee && $employee->approval_line) {
                    $manager = Employee::where('employee_code', $employee->approval_line)->with('user')->first();
                    return $manager?->user?->id;
                }
            }

            $user = User::role($role->name)->first();
            return $user?->id;
        }

        // 3) Specific Employee → map to its User
        if ($layer->approver_type === Employee::class || $layer->approver_type === 'App\\Models\\Employee') {
            $employee = Employee::with('user')->find($layer->approver_id);
            return $employee?->user?->id;
        }

        // 4) Specific User
        if ($layer->approver_type === User::class || $layer->approver_type === 'App\\Models\\User') {
            return (int) $layer->approver_id;
        }

        return null;
    }

    /**
     * Get requester Employee model for this approvable.
     * Note: Eloquent attribute tidak perlu property_exists; cukup akses field-nya.
     */
    protected function resolveRequesterEmployee(): ?Employee
    {
        try {
            // gunakan attribute standard 'employee_id' jika ada
            if (isset($this->employee_id) && $this->employee_id) {
                return Employee::find($this->employee_id);
            }
        } catch (\Throwable $e) {
            // ignore
        }
        return null;
    }
}
