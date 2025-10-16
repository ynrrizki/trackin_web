<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\LeaveCategory;
use App\Models\Holiday;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveSettingsController extends Controller
{
    public function categories()
    {
        $categories = LeaveCategory::query()
            ->orderBy('name')
            ->get([
                'id','code','name','is_paid','deduct_balance','half_day_allowed','weekend_rule','base_quota_days','prorate_on_join','prorate_on_resign','carryover_max_days','carryover_expiry_months','requires_proof','created_at'
            ]);

        return Inertia::render('settings/hrms/leave-categories', [
            'categories' => $categories,
        ]);
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:leave_categories,code',
            'name' => 'required|string|max:255',
            'is_paid' => 'boolean',
            'deduct_balance' => 'boolean',
            'half_day_allowed' => 'boolean',
            'weekend_rule' => 'required|in:workdays,calendar',
            'base_quota_days' => 'nullable|integer|min:0|max:365',
            'prorate_on_join' => 'boolean',
            'prorate_on_resign' => 'boolean',
            'carryover_max_days' => 'nullable|integer|min:0|max:365',
            'carryover_expiry_months' => 'nullable|integer|min:0|max:24',
            'requires_proof' => 'boolean',
        ]);

        LeaveCategory::create($validated);

        return back()->with('success', 'Kategori cuti berhasil dibuat');
    }

    public function updateCategory(Request $request, LeaveCategory $category)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:leave_categories,code,' . $category->id,
            'name' => 'required|string|max:255',
            'is_paid' => 'boolean',
            'deduct_balance' => 'boolean',
            'half_day_allowed' => 'boolean',
            'weekend_rule' => 'required|in:workdays,calendar',
            'base_quota_days' => 'nullable|integer|min:0|max:365',
            'prorate_on_join' => 'boolean',
            'prorate_on_resign' => 'boolean',
            'carryover_max_days' => 'nullable|integer|min:0|max:365',
            'carryover_expiry_months' => 'nullable|integer|min:0|max:24',
            'requires_proof' => 'boolean',
        ]);

        $category->update($validated);

        return back()->with('success', 'Kategori cuti berhasil diperbarui');
    }

    public function destroyCategory(LeaveCategory $category)
    {
        $category->delete();
        return back()->with('success', 'Kategori cuti berhasil dihapus');
    }

    public function holidays()
    {
        $holidays = Holiday::query()
            ->orderBy('date')
            ->get(['id','date','name','is_cuti_bersama','created_at']);

        return Inertia::render('settings/hrms/holidays', [
            'holidays' => $holidays,
        ]);
    }

    public function storeHoliday(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'name' => 'required|string|max:255',
            'is_cuti_bersama' => 'boolean',
        ]);

        Holiday::create($validated);

        return back()->with('success', 'Hari libur berhasil ditambahkan');
    }

    public function updateHoliday(Request $request, Holiday $holiday)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'name' => 'required|string|max:255',
            'is_cuti_bersama' => 'boolean',
        ]);

        $holiday->update($validated);

        return back()->with('success', 'Hari libur berhasil diperbarui');
    }

    public function destroyHoliday(Holiday $holiday)
    {
        $holiday->delete();
        return back()->with('success', 'Hari libur berhasil dihapus');
    }
}
