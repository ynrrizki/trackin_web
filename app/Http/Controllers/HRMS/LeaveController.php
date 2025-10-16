<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\Employee;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $query = LeaveRequest::with(['employee.department', 'employee.outsourcingField', 'approvable']);

        // Filter by date range
        if ($request->date_from && $request->date_to) {
            $query->where(function ($q) use ($request) {
                $q->whereBetween('start_date', [$request->date_from, $request->date_to])
                    ->orWhereBetween('end_date', [$request->date_from, $request->date_to])
                    ->orWhere(function ($subQ) use ($request) {
                        $subQ->where('start_date', '<=', $request->date_from)
                            ->where('end_date', '>=', $request->date_to);
                    });
            });
        } elseif ($request->date_from) {
            $query->where('end_date', '>=', $request->date_from);
        } elseif ($request->date_to) {
            $query->where('start_date', '<=', $request->date_to);
        } else {
            // Default to current month
            $query->whereMonth('start_date', '<=', now()->month)
                ->whereYear('start_date', now()->year)
                ->whereMonth('end_date', '>=', now()->month)
                ->whereYear('end_date', now()->year);
        }

        // Filter by employee
        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }

        // Filter by department
        if ($request->department_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        // Filter by employee type (internal/outsourcing)
        if ($request->employee_type === 'internal') {
            $query->whereHas('employee', function ($q) {
                $q->whereNull('outsourcing_field_id');
            });
        } elseif ($request->employee_type === 'outsourcing') {
            $query->whereHas('employee', function ($q) {
                $q->whereNotNull('outsourcing_field_id');
            });
        }

        // Filter by outsourcing field
        if ($request->outsourcing_field_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('outsourcing_field_id', $request->outsourcing_field_id);
            });
        }

        // Search by employee name or code
        if ($request->search) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('full_name', 'like', '%' . $request->search . '%')
                    ->orWhere('employee_code', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by approval status
        if ($request->status) {
            if ($request->status === 'pending') {
                $query->pending();
            } elseif ($request->status === 'approved') {
                $query->approved();
            } elseif ($request->status === 'rejected') {
                $query->rejected();
            }
        }

        // Filter by duration
        if ($request->duration_filter === 'short') {
            $query->whereRaw('DATEDIFF(end_date, start_date) + 1 <= 3');
        } elseif ($request->duration_filter === 'medium') {
            $query->whereRaw('DATEDIFF(end_date, start_date) + 1 BETWEEN 4 AND 7');
        } elseif ($request->duration_filter === 'long') {
            $query->whereRaw('DATEDIFF(end_date, start_date) + 1 > 7');
        }

        $leaveRequests = $query->orderBy('start_date', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get filter options
        $employees = Employee::select('id', 'full_name', 'employee_code')
            ->with('department:id,name')
            ->orderBy('full_name')
            ->get();

        $departments = Department::select('id', 'name')->orderBy('name')->get();

        $outsourcingFields = \App\Models\OutsourcingField::select('id', 'name')
            ->orderBy('name')
            ->get();

        // Statistics
        $stats = $this->getLeaveStats($request);

        return Inertia::render('hrms/leave/page', [
            'leaveRequests' => $leaveRequests,
            'employees' => $employees,
            'departments' => $departments,
            'outsourcingFields' => $outsourcingFields,
            'filters' => $request->only(['date_from', 'date_to', 'employee_id', 'department_id', 'employee_type', 'outsourcing_field_id', 'search', 'status', 'duration_filter']),
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        $employees = Employee::select('id', 'full_name', 'employee_code')
            ->with(['department:id,name', 'shift:id,name'])
            ->active()
            ->orderBy('full_name')
            ->get();

        return Inertia::render('hrms/leave/create', [
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:500',
        ]);

        // Check for overlapping leave requests
        $overlapping = LeaveRequest::where('employee_id', $validated['employee_id'])
            ->where(function ($query) use ($validated) {
                $query->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhere(function ($subQuery) use ($validated) {
                        $subQuery->where('start_date', '<=', $validated['start_date'])
                            ->where('end_date', '>=', $validated['end_date']);
                    });
            })
            ->where(function ($query) {
                $query->pending()->orWhere(function ($subQuery) {
                    $subQuery->approved();
                });
            })
            ->exists();

        if ($overlapping) {
            return back()->withErrors(['start_date' => 'There is an overlapping leave request for this period']);
        }

        $leaveRequest = LeaveRequest::create([
            'employee_id' => $validated['employee_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => $validated['reason'],
        ]);

        // Create approval record
        $leaveRequest->createApprovalFlow();

        return redirect()->route('hrms.leave.index')
            ->with('success', 'Leave request created successfully');
    }

    public function show(LeaveRequest $leave)
    {
        $leave->load(['employee.department', 'employee.outsourcingField', 'approvable.approvals.approver']);

        return Inertia::render('hrms/leave/show', [
            'leave' => $leave,
        ]);
    }

    public function edit(LeaveRequest $leave)
    {
        $leave->load('employee');

        // Only allow editing if not yet approved
        if ($leave->isApproved()) {
            return redirect()->route('hrms.leave.index')
                ->with('error', 'Cannot edit approved leave request');
        }

        return Inertia::render('hrms/leave/edit', [
            'leave' => $leave,
        ]);
    }

    public function update(Request $request, LeaveRequest $leave)
    {
        // Only allow updating if not yet approved
        if ($leave->isApproved()) {
            return redirect()->route('hrms.leave.index')
                ->with('error', 'Cannot update approved leave request');
        }

        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:500',
        ]);

        // Check for overlapping leave requests (excluding current one)
        $overlapping = LeaveRequest::where('employee_id', $leave->employee_id)
            ->where('id', '!=', $leave->id)
            ->where(function ($query) use ($validated) {
                $query->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                    ->orWhere(function ($subQuery) use ($validated) {
                        $subQuery->where('start_date', '<=', $validated['start_date'])
                            ->where('end_date', '>=', $validated['end_date']);
                    });
            })
            ->where(function ($query) {
                $query->pending()->orWhere(function ($subQuery) {
                    $subQuery->approved();
                });
            })
            ->exists();

        if ($overlapping) {
            return back()->withErrors(['start_date' => 'There is an overlapping leave request for this period']);
        }

        $leave->update([
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => $validated['reason'],
        ]);

        return redirect()->route('hrms.leave.index')
            ->with('success', 'Leave request updated successfully');
    }

    public function destroy(LeaveRequest $leave)
    {
        // Only allow deletion if not yet approved
        if ($leave->isApproved()) {
            return redirect()->route('hrms.leave.index')
                ->with('error', 'Cannot delete approved leave request');
        }

        $leave->delete();

        return redirect()->route('hrms.leave.index')
            ->with('success', 'Leave request deleted successfully');
    }

    public function approve(LeaveRequest $leave)
    {
        if ($leave->approvable) {
            $leave->approvable->approve();
        }

        return redirect()->route('hrms.leave.index')
            ->with('success', 'Leave request approved successfully');
    }

    public function reject(Request $request, LeaveRequest $leave)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500'
        ]);

        if ($leave->approvable) {
            $leave->approvable->reject($validated['rejection_reason']);
        }

        return redirect()->route('hrms.leave.index')
            ->with('success', 'Leave request rejected');
    }

    private function getLeaveStats($request)
    {
        $query = LeaveRequest::query();

        // Apply same filters as main query
        if ($request->date_from && $request->date_to) {
            $query->where(function ($q) use ($request) {
                $q->whereBetween('start_date', [$request->date_from, $request->date_to])
                    ->orWhereBetween('end_date', [$request->date_from, $request->date_to])
                    ->orWhere(function ($subQ) use ($request) {
                        $subQ->where('start_date', '<=', $request->date_from)
                            ->where('end_date', '>=', $request->date_to);
                    });
            });
        } else {
            $query->whereMonth('start_date', '<=', now()->month)
                ->whereYear('start_date', now()->year)
                ->whereMonth('end_date', '>=', now()->month)
                ->whereYear('end_date', now()->year);
        }

        $totalRequests = $query->count();
        $pendingRequests = $query->pending()->count();
        $approvedRequests = $query->approved()->count();
        $rejectedRequests = $query->rejected()->count();

        // Calculate total leave days for approved requests
        $totalDays = $query->approved()->get()->sum(function ($leave) {
            return Carbon::parse($leave->start_date)->diffInDays(Carbon::parse($leave->end_date)) + 1;
        });

        // Average leave duration
        $avgDuration = $approvedRequests > 0 ? round($totalDays / $approvedRequests, 1) : 0;

        return [
            'total_requests' => $totalRequests,
            'pending_requests' => $pendingRequests,
            'approved_requests' => $approvedRequests,
            'rejected_requests' => $rejectedRequests,
            'total_days' => $totalDays,
            'avg_duration' => $avgDuration,
            'approval_rate' => $totalRequests > 0 ? round(($approvedRequests / $totalRequests) * 100, 1) : 0,
        ];
    }
}
