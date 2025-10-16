<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\Overtime;
use App\Models\Employee;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class OvertimeController extends Controller
{
    public function index(Request $request)
    {
        $query = Overtime::with(['employee.department', 'employee.outsourcingField', 'approvable']);

        // Filter by date range
        if ($request->date_from && $request->date_to) {
            $query->whereBetween('date', [$request->date_from, $request->date_to]);
        } elseif ($request->date_from) {
            $query->where('date', '>=', $request->date_from);
        } elseif ($request->date_to) {
            $query->where('date', '<=', $request->date_to);
        } else {
            // Default to current month
            $query->whereMonth('date', now()->month)
                ->whereYear('date', now()->year);
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

        $overtimes = $query->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
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
        $stats = $this->getOvertimeStats($request);

        return Inertia::render('hrms/overtime/page', [
            'overtimes' => $overtimes,
            'employees' => $employees,
            'departments' => $departments,
            'outsourcingFields' => $outsourcingFields,
            'filters' => $request->only(['date_from', 'date_to', 'employee_id', 'department_id', 'employee_type', 'outsourcing_field_id', 'search', 'status']),
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

        return Inertia::render('hrms/overtime/create', [
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'required|string|max:500',
        ]);

        // Convert time to datetime for easier calculation
        $startDateTime = Carbon::createFromFormat('Y-m-d H:i', $validated['date'] . ' ' . $validated['start_time']);
        $endDateTime = Carbon::createFromFormat('Y-m-d H:i', $validated['date'] . ' ' . $validated['end_time']);

        // If end time is before start time, assume it's next day
        if ($endDateTime->lt($startDateTime)) {
            $endDateTime->addDay();
        }

        $overtime = Overtime::create([
            'employee_id' => $validated['employee_id'],
            'date' => $validated['date'],
            'start_time' => $startDateTime,
            'end_time' => $endDateTime,
            'description' => $validated['description'],
        ]);

        // Create approval record
        $overtime->createApprovalFlow();

        return redirect()->route('hrms.overtime.index')
            ->with('success', 'Overtime request created successfully');
    }

    public function show(Overtime $overtime)
    {
        $overtime->load(['employee.department', 'employee.outsourcingField', 'approvable.approvals.approver']);

        return Inertia::render('hrms/overtime/show', [
            'overtime' => $overtime,
        ]);
    }

    public function edit(Overtime $overtime)
    {
        $overtime->load('employee');

        // Only allow editing if not yet approved
        if ($overtime->isApproved()) {
            return redirect()->route('hrms.overtime.index')
                ->with('error', 'Cannot edit approved overtime request');
        }

        return Inertia::render('hrms/overtime/edit', [
            'overtime' => $overtime,
        ]);
    }

    public function update(Request $request, Overtime $overtime)
    {
        // Only allow updating if not yet approved
        if ($overtime->isApproved()) {
            return redirect()->route('hrms.overtime.index')
                ->with('error', 'Cannot update approved overtime request');
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'description' => 'required|string|max:500',
        ]);

        // Convert time to datetime for easier calculation
        $startDateTime = Carbon::createFromFormat('Y-m-d H:i', $validated['date'] . ' ' . $validated['start_time']);
        $endDateTime = Carbon::createFromFormat('Y-m-d H:i', $validated['date'] . ' ' . $validated['end_time']);

        // If end time is before start time, assume it's next day
        if ($endDateTime->lt($startDateTime)) {
            $endDateTime->addDay();
        }

        $overtime->update([
            'date' => $validated['date'],
            'start_time' => $startDateTime,
            'end_time' => $endDateTime,
            'description' => $validated['description'],
        ]);

        return redirect()->route('hrms.overtime.index')
            ->with('success', 'Overtime request updated successfully');
    }

    public function destroy(Overtime $overtime)
    {
        // Only allow deletion if not yet approved
        if ($overtime->isApproved()) {
            return redirect()->route('hrms.overtime.index')
                ->with('error', 'Cannot delete approved overtime request');
        }

        $overtime->delete();

        return redirect()->route('hrms.overtime.index')
            ->with('success', 'Overtime request deleted successfully');
    }

    public function approve(Overtime $overtime)
    {
        if ($overtime->approvable) {
            $overtime->approvable->approve();
        }

        return redirect()->route('hrms.overtime.index')
            ->with('success', 'Overtime request approved successfully');
    }

    public function reject(Request $request, Overtime $overtime)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500'
        ]);

        if ($overtime->approvable) {
            $overtime->approvable->reject($validated['rejection_reason']);
        }

        return redirect()->route('hrms.overtime.index')
            ->with('success', 'Overtime request rejected');
    }

    private function getOvertimeStats($request)
    {
        $query = Overtime::query();

        // Apply same filters as main query
        if ($request->date_from && $request->date_to) {
            $query->whereBetween('date', [$request->date_from, $request->date_to]);
        } elseif ($request->date_from) {
            $query->where('date', '>=', $request->date_from);
        } elseif ($request->date_to) {
            $query->where('date', '<=', $request->date_to);
        } else {
            $query->whereMonth('date', now()->month)
                ->whereYear('date', now()->year);
        }

        $totalRequests = $query->count();
        $pendingRequests = $query->pending()->count();
        $approvedRequests = $query->approved()->count();
        $rejectedRequests = $query->rejected()->count();

        // Calculate total overtime hours for approved requests
        $totalHours = $query->approved()->get()->sum(function ($overtime) {
            return Carbon::parse($overtime->start_time)->diffInHours(Carbon::parse($overtime->end_time));
        });

        // Calculate total overtime pay (assuming hourly rate)
        $hourlyRate = 25000; // This could be configurable
        $totalPay = $totalHours * $hourlyRate;

        return [
            'total_requests' => $totalRequests,
            'pending_requests' => $pendingRequests,
            'approved_requests' => $approvedRequests,
            'rejected_requests' => $rejectedRequests,
            'total_hours' => $totalHours,
            'total_pay' => $totalPay,
            'approval_rate' => $totalRequests > 0 ? round(($approvedRequests / $totalRequests) * 100, 1) : 0,
        ];
    }
}
