<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeTransferController extends Controller
{
    public function all(Request $request)
    {
        $histories = EmployeeHistory::with(['employee', 'fromPosition', 'toPosition', 'fromDepartment', 'toDepartment', 'approvals.approver'])
            ->orderByDesc('created_at')
            ->paginate(30);

        return Inertia::render('hrms/employee/transfer-history', [
            'histories' => $histories,
        ]);
    }
    public function index(Employee $employee)
    {
        $histories = EmployeeHistory::with(['approvals.approver', 'approvals.sender', 'fromPosition', 'toPosition', 'fromDepartment', 'toDepartment'])
            ->where('employee_id', $employee->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'histories' => $histories->map(function ($h) {
                return [
                    'id' => $h->id,
                    'type' => $h->type,
                    'status' => $h->approval_status, // still accessible from trait (latest approval)
                    'effective_date' => optional($h->effective_date)->toDateString(),
                    'applied_at' => optional($h->applied_at)->toDateTimeString(),
                    'change_reason' => $h->change_reason,
                    'from' => [
                        'position' => optional($h->fromPosition)->name,
                        'department' => optional($h->fromDepartment)->name,
                    ],
                    'to' => [
                        'position' => optional($h->toPosition)->name,
                        'department' => optional($h->toDepartment)->name,
                    ],
                    'approvals' => $h->approvals->map(function ($ap) {
                        return [
                            'id' => $ap->id,
                            'status' => strtolower($ap->getAttributes()['status'] ?? 'pending'),
                            'approver_name' => optional($ap->approver)->name,
                            'created_at' => optional($ap->created_at)->toDateTimeString(),
                        ];
                    })
                ];
            })
        ]);
    }

    public function store(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:transfer,mutation,rotation',
            'to_position_id' => 'required|exists:positions,id',
            'to_level_id' => 'required|exists:position_levels,id',
            'to_department_id' => 'required|exists:departments,id',
            'to_shift_id' => 'nullable|exists:shifts,id',
            'to_employment_status_id' => 'required|exists:employment_statuses,id',
            'effective_date' => 'required|date|after_or_equal:today',
            'change_reason' => 'nullable|string|max:500',
            'approval_line' => 'nullable|string|max:30',
        ]);

        $history = EmployeeHistory::create([
            'employee_id' => $employee->id,
            'type' => $validated['type'],
            'from_position_id' => $employee->position_id,
            'to_position_id' => $validated['to_position_id'],
            'from_level_id' => $employee->level_id,
            'to_level_id' => $validated['to_level_id'],
            'from_department_id' => $employee->department_id,
            'to_department_id' => $validated['to_department_id'],
            'from_shift_id' => $employee->shift_id,
            'to_shift_id' => $validated['to_shift_id'] ?? null,
            'from_employment_status_id' => $employee->employment_status_id,
            'to_employment_status_id' => $validated['to_employment_status_id'],
            'change_reason' => $validated['change_reason'] ?? null,
            'effective_date' => $validated['effective_date'],
            'approval_line' => $validated['approval_line'] ?? null,
        ]);

        return response()->json([
            'message' => 'Transfer request created',
            'history_id' => $history->id,
            'status' => $history->approval_status,
        ], 201);
    }
}
