<?php

namespace App\Http\Controllers\Api\V1\HRMS;

use App\Http\Controllers\Controller;
use App\Models\LeaveCategory;

class LeaveMetaController extends Controller
{
    /**
     * GET /v1/hrms/leave-categories
     * Lightweight list of leave categories for mobile clients
     */
    public function categories()
    {
        $cats = LeaveCategory::query()
            ->select(['id','code','name','deduct_balance','half_day_allowed','weekend_rule','base_quota_days','requires_proof'])
            ->orderBy('code')
            ->get()
            ->map(fn($c) => [
                'code' => $c->code,
                'name' => $c->name,
                'deduct_balance' => (bool)$c->deduct_balance,
                'half_day_allowed' => (bool)$c->half_day_allowed,
                'weekend_rule' => $c->weekend_rule,
                'base_quota_days' => $c->base_quota_days,
                'requires_proof' => (bool)$c->requires_proof,
            ]);

        return response()->json(['data' => $cats]);
    }
}
