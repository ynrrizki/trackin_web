<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\LeaveCategory;
use App\Models\LeavePolicy;
use Carbon\Carbon;

class LeavePolicyResolver
{
    /**
     * Resolve the active policy for given employee & category on a date, applying priority.
     * Order: employee > job_level > branch > department > company (lowest priority value wins on ties).
     */
    public function resolve(Employee $employee, LeaveCategory $category, Carbon $onDate): ?LeavePolicy
    {
        $policies = LeavePolicy::where('leave_category_id', $category->id)
            ->where(function ($q) use ($onDate) {
                $q->where('effective_start', '<=', $onDate)
                  ->where(function ($qq) use ($onDate) {
                      $qq->whereNull('effective_end')->orWhere('effective_end', '>=', $onDate);
                  });
            })
            ->orderBy('priority')
            ->get();

        $candidates = [];
        foreach ($policies as $p) {
            $score = null;
            switch ($p->scope_type) {
                case 'employee':
                    if ($p->scope_id === $employee->id) $score = 1;
                    break;
                case 'job_level':
                    if ($p->scope_id && $employee->employee_type_id == $p->scope_id) $score = 2;
                    break;
                case 'branch':
                    if ($p->scope_id && method_exists($employee, 'branch_id') && $employee->branch_id == $p->scope_id) $score = 3;
                    break;
                case 'department':
                    if ($p->scope_id && $employee->department_id == $p->scope_id) $score = 4;
                    break;
                case 'company':
                default:
                    $score = 5;
                    break;
            }
            if ($score !== null) {
                $candidates[] = [$score, $p->priority, $p];
            }
        }

        if (empty($candidates)) return null;
        usort($candidates, function ($a, $b) {
            // lower score first, then lower priority number first
            return [$a[0], $a[1]] <=> [$b[0], $b[1]];
        });
        return $candidates[0][2];
    }
}
