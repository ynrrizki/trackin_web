<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\LeaveCategory;
use App\Models\LeaveEntitlement;
use App\Support\WorkdayCalendar;
use Carbon\Carbon;

class LeaveEntitlementEngine
{
    public function recalcYear(Employee $employee, LeaveCategory $category, int $year): LeaveEntitlement
    {
        $period = (string)$year;
        $ent = LeaveEntitlement::firstOrNew([
            'employee_id' => $employee->id,
            'leave_category_id' => $category->id,
            'period' => $period,
        ]);

        $opening = $ent->opening ?? 0;
        $base = $category->base_quota_days ?? 0;
        $accrual = $base; // TODO: apply prorata join/resign policy when data available

        // Apply cuti bersama deductions if category is annual and flag enabled
        if (($category->code ?? null) === 'ANNUAL') {
            // naive: count cuti bersama days in this year
            $start = Carbon::create($year, 1, 1);
            $end = Carbon::create($year, 12, 31);
            // Use WorkdayCalendar to skip weekends if workdays rule
            $workdays = WorkdayCalendar::workdaysBetween($start, $end);
            // In a complete implementation, fetch holidays with is_cuti_bersama
            // and intersect with workdays; here we keep accrual and let consumption handle.
        }

        // Derive consumed from approved leave requests within period for this category
        $yearStart = Carbon::create($year, 1, 1);
        $yearEnd = Carbon::create($year, 12, 31);
        $consumed = \App\Models\LeaveRequest::query()
            ->where('employee_id', $employee->id)
            ->when($category->id, fn($q) => $q->where('leave_category_id', $category->id))
            ->whereHas('approvals', function ($q) {
                $q->where('status', 'approved');
            })
            ->where(function ($q) use ($yearStart, $yearEnd) {
                $q->whereBetween('start_date', [$yearStart, $yearEnd])
                  ->orWhereBetween('end_date', [$yearStart, $yearEnd])
                  ->orWhere(function ($qq) use ($yearStart, $yearEnd) {
                      $qq->where('start_date', '<=', $yearStart)
                         ->where('end_date', '>=', $yearEnd);
                  });
            })
            ->get()
            ->sum(function ($lr) use ($category) {
                // Count days according to weekend rule
                $start = $lr->start_date instanceof Carbon ? $lr->start_date : Carbon::parse($lr->start_date);
                $end = $lr->end_date instanceof Carbon ? $lr->end_date : Carbon::parse($lr->end_date);
                if (($category->weekend_rule ?? 'workdays') === 'workdays') {
                    return count(WorkdayCalendar::workdaysBetween($start, $end));
                }
                return $start->diffInDays($end) + 1;
            });
        $carryIn = $ent->carry_in ?? 0;
        $carryOut = min($category->carryover_max_days ?? 0, max(0, ($opening + $accrual + $carryIn) - $consumed));
        $closing = max(0, ($opening + $accrual + $carryIn) - $consumed - $carryOut);

        $ent->opening = $opening;
        $ent->accrual = $accrual;
        $ent->consumed = $consumed;
        $ent->carry_in = $carryIn;
        $ent->carry_out = $carryOut;
        $ent->closing = $closing;
        if (!empty($category->carryover_expiry_months)) {
            $ent->expires_at = Carbon::create($year + 1, 1, 1)->addMonths($category->carryover_expiry_months);
        }
        $ent->save();
        return $ent;
    }
}
