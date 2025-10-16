<?php

namespace App\Http\Controllers\Api\V1\HRMS;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\LeaveCategory;
use App\Models\LeaveEntitlement;
use App\Services\LeaveEntitlementEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LeaveEntitlementController extends Controller
{
    /**
     * GET /v1/hrms/leave-entitlements?year=YYYY
     * Returns leave entitlements/balances for the current user for the given year.
     */
    public function index(Request $request, LeaveEntitlementEngine $engine)
    {
        $user = Auth::user();
        $employee = Employee::where('user_id', optional($user)->id)->first();
        if (!$employee) {
            return response()->json(['message' => 'Employee not found for user'], 422);
        }

        $year = (int) ($request->query('year', now()->year));
        $period = (string) $year;

        // Choose categories that have balances (deduct_balance) or with base_quota_days
        $categories = LeaveCategory::query()
            ->where(function ($q) {
                $q->where('deduct_balance', true)->orWhereNotNull('base_quota_days');
            })
            ->orderBy('code')
            ->get();

        $entitlements = [];
        foreach ($categories as $cat) {
            $ent = LeaveEntitlement::where('employee_id', $employee->id)
                ->where('leave_category_id', $cat->id)
                ->where('period', $period)
                ->first();

            if (!$ent) {
                // lazily (re)calculate for this category/year
                $ent = $engine->recalcYear($employee, $cat, $year);
            }

            $entitlements[] = [
                'category_code' => $cat->code,
                'category_name' => $cat->name,
                'period' => $ent->period,
                'opening' => (int) $ent->opening,
                'accrual' => (int) $ent->accrual,
                'consumed' => (int) $ent->consumed,
                'carry_in' => (int) $ent->carry_in,
                'carry_out' => (int) $ent->carry_out,
                'closing' => (int) $ent->closing,
                'expires_at' => optional($ent->expires_at)->toDateString(),
            ];
        }

        return response()->json([
            'data' => $entitlements,
            'meta' => [
                'server_time' => now()->toISOString(),
                'year' => $year,
            ],
        ]);
    }
}
