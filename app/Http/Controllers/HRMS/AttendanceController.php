<?php

namespace App\Http\Controllers\HRMS;

use App\Exports\AttendanceExportTest;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Shift;
use App\Exports\AttendanceExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::with(['employee.department', 'employee.shift', 'employee.outsourcingField']);

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

        // Filter by shift
        if ($request->shift_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('shift_id', $request->shift_id);
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

        // Filter by status
        if ($request->status === 'complete') {
            $query->whereNotNull('time_in')->whereNotNull('time_out');
        } elseif ($request->status === 'incomplete') {
            $query->whereNotNull('time_in')->whereNull('time_out');
        } elseif ($request->status === 'late') {
            $query->whereNotNull('time_in')
                ->whereHas('employee.shift', function ($q) {
                    $this->applyLateCondition($q);
                });
        }

        $attendances = $query->orderBy('date', 'desc')
            ->orderBy('time_in', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get filter options
        $filterOptions = $this->getFilterOptions();

        // Statistics
        $stats = $this->getAttendanceStats($request);

        return Inertia::render('hrms/attendance/page', [
            'attendances' => $attendances,
            'filterOptions' => $filterOptions,
            'filters' => $request->only(['date_from', 'date_to', 'employee_id', 'department_id', 'shift_id', 'employee_type', 'outsourcing_field_id', 'search', 'status']),
            'stats' => $stats,
        ]);
    }

    public function create()
    {
        return Inertia::render('hrms/attendance/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'time_in' => 'required|date_format:H:i',
            'time_out' => 'nullable|date_format:H:i|after:time_in',
            'notes' => 'nullable|string|max:500',
        ]);

        // Check if attendance already exists for this date
        $existingAttendance = Attendance::where('employee_id', $validated['employee_id'])
            ->where('date', $validated['date'])
            ->first();

        if ($existingAttendance) {
            return back()->withErrors(['date' => 'Attendance record already exists for this date']);
        }

        Attendance::create([
            'employee_id' => $validated['employee_id'],
            'date' => $validated['date'],
            'time_in' => $validated['time_in'],
            'time_out' => $validated['time_out'],
            'latlot_in' => null, // Manual entry doesn't require location
            'latlot_out' => null,
            'is_fake_map_detected' => false,
        ]);

        return redirect()->route('hrms.attendance.index')
            ->with('success', 'Attendance record created successfully');
    }

    public function show(Attendance $attendance)
    {
        $attendance->load(['employee.department', 'employee.shift', 'employee.outsourcingField']);

        return Inertia::render('hrms/attendance/show', [
            'attendance' => $attendance,
        ]);
    }

    public function edit(Attendance $attendance)
    {
        $attendance->load('employee');

        return Inertia::render('hrms/attendance/edit', [
            'attendance' => $attendance,
        ]);
    }

    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'time_in' => 'required|date_format:H:i',
            'time_out' => 'nullable|date_format:H:i|after:time_in',
            'notes' => 'nullable|string|max:500',
        ]);

        $attendance->update([
            'time_in' => $validated['time_in'],
            'time_out' => $validated['time_out'],
        ]);

        return redirect()->route('hrms.attendance.index')
            ->with('success', 'Attendance record updated successfully');
    }

    public function destroy(Attendance $attendance)
    {
        $attendance->delete();

        return redirect()->route('hrms.attendance.index')
            ->with('success', 'Attendance record deleted successfully');
    }

    public function bulkCreate()
    {
        return Inertia::render('hrms/attendance/bulk-create');
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'required|exists:employees,id',
            'date' => 'required|date',
            'time_in' => 'required|date_format:H:i',
            'time_out' => 'nullable|date_format:H:i|after:time_in',
            'notes' => 'nullable|string|max:500',
        ]);

        $createdCount = 0;
        $skippedCount = 0;
        $errors = [];

        foreach ($validated['employee_ids'] as $employeeId) {
            // Check if attendance already exists for this employee on this date
            $existingAttendance = Attendance::where('employee_id', $employeeId)
                ->where('date', $validated['date'])
                ->first();

            if ($existingAttendance) {
                $employee = Employee::find($employeeId);
                $skippedCount++;
                $errors[] = "Attendance already exists for {$employee->full_name} on {$validated['date']}";
                continue;
            }

            try {
                Attendance::create([
                    'employee_id' => $employeeId,
                    'date' => $validated['date'],
                    'time_in' => $validated['time_in'],
                    'time_out' => $validated['time_out'],
                    'latlot_in' => null, // Bulk entry doesn't require location
                    'latlot_out' => null,
                    'is_fake_map_detected' => false,
                ]);
                $createdCount++;
            } catch (\Exception $e) {
                $employee = Employee::find($employeeId);
                $errors[] = "Failed to create attendance for {$employee->full_name}: {$e->getMessage()}";
                $skippedCount++;
            }
        }

        $message = "Successfully created {$createdCount} attendance record(s).";
        if ($skippedCount > 0) {
            $message .= " {$skippedCount} record(s) were skipped.";
        }

        $redirect = redirect()->route('hrms.attendance.index')->with('success', $message);

        if (!empty($errors)) {
            $redirect = $redirect->with('warnings', $errors);
        }

        return $redirect;
    }

    public function export(Request $request)
    {
        try {
            $filters = $request->only([
                'date_from',
                'date_to',
                'employee_id',
                'department_id',
                'shift_id',
                'employee_type',
                'outsourcing_field_id',
                'search',
                'status'
            ]);

            $filters = array_filter($filters, function($value) {
                return $value !== null && $value !== '';
            });

            $filename = 'attendance-export-' . now()->format('Y-m-d-H-i-s') . '.xlsx';

            Log::info('Exporting attendance', ['filename' => $filename, 'filters' => $filters]);

            return Excel::download(new AttendanceExport($filters), $filename);
            // return Excel::download(new AttendanceExportTest(), $filename);
        } catch (\Exception $e) {
            Log::error('Attendance export error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }

    private function getAttendanceStats($request)
    {
        // Base query for stats (replicate filters from index)
        $base = Attendance::query();

        if ($request->date_from && $request->date_to) {
            $base->whereBetween('date', [$request->date_from, $request->date_to]);
        } elseif ($request->date_from) {
            $base->where('date', '>=', $request->date_from);
        } elseif ($request->date_to) {
            $base->where('date', '<=', $request->date_to);
        } else {
            $base->whereMonth('date', now()->month)
                ->whereYear('date', now()->year);
        }

        // Mirror selected employee-level filters (subset sufficient for stats)
        if ($request->employee_id) {
            $base->where('employee_id', $request->employee_id);
        }
        if ($request->department_id) {
            $base->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }
        if ($request->shift_id) {
            $base->whereHas('employee', function ($q) use ($request) {
                $q->where('shift_id', $request->shift_id);
            });
        }
        if ($request->employee_type === 'internal') {
            $base->whereHas('employee', function ($q) {
                $q->whereNull('outsourcing_field_id');
            });
        } elseif ($request->employee_type === 'outsourcing') {
            $base->whereHas('employee', function ($q) {
                $q->whereNotNull('outsourcing_field_id');
            });
        }
        if ($request->outsourcing_field_id) {
            $base->whereHas('employee', function ($q) use ($request) {
                $q->where('outsourcing_field_id', $request->outsourcing_field_id);
            });
        }
        if ($request->search) {
            $base->whereHas('employee', function ($q) use ($request) {
                $q->where('full_name', 'like', '%' . $request->search . '%')
                    ->orWhere('employee_code', 'like', '%' . $request->search . '%');
            });
        }

        $totalRecords = (clone $base)->count();
        $completeRecords = (clone $base)->whereNotNull('time_in')->whereNotNull('time_out')->count();
        $incompleteRecords = (clone $base)->whereNotNull('time_in')->whereNull('time_out')->count();
        $lateRecords = (clone $base)->whereNotNull('time_in')
            ->whereHas('employee.shift', function ($q) {
                $this->applyLateCondition($q);
            })
            ->count();

        return [
            'total_records' => $totalRecords,
            'complete_records' => $completeRecords,
            'incomplete_records' => $incompleteRecords,
            'late_records' => $lateRecords,
            'completion_rate' => $totalRecords > 0 ? round(($completeRecords / $totalRecords) * 100, 1) : 0,
        ];
    }

    private function getFilterOptions()
    {
        $employees = Employee::select('id', 'full_name', 'employee_code')
            ->with('department:id,name')
            ->orderBy('full_name')
            ->get();

        $departments = Department::select('id', 'name')->orderBy('name')->get();
        $shifts = Shift::select('id', 'name')->orderBy('name')->get();

        $outsourcingFields = \App\Models\OutsourcingField::select('id', 'name')
            ->orderBy('name')
            ->get();

        return [
            'employees' => $employees,
            'departments' => $departments,
            'shifts' => $shifts,
            'outsourcingFields' => $outsourcingFields,
            'employeeTypes' => [
                ['value' => 'internal', 'label' => 'Internal'],
                ['value' => 'outsourcing', 'label' => 'Outsourcing'],
            ],
            'statuses' => [
                ['value' => 'complete', 'label' => 'Complete'],
                ['value' => 'incomplete', 'label' => 'Incomplete'],
                ['value' => 'late', 'label' => 'Late'],
            ],
        ];
    }

    private function applyLateCondition($q): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            // Compare times only, add 15 minutes via ADDTIME
            $q->whereRaw('TIME(attendances.time_in) > ADDTIME(TIME(shifts.start_time), "00:15:00")');
        } elseif (in_array($driver, ['pgsql', 'postgres', 'postgresql'])) {
            $q->whereRaw("attendances.time_in::time > (shifts.start_time::time + interval '15 minutes')");
        } else {
            // Generic fallback: cast to time if possible, else compare datetime adding 900 seconds
            $q->whereRaw('(attendances.time_in > shifts.start_time AND EXTRACT(EPOCH FROM (attendances.time_in - shifts.start_time)) > 900)');
        }
    }
}
