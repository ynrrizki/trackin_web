<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\EmployeeType;
use App\Models\EmploymentStatus;
use App\Models\Shift;
use App\Models\ShiftProject;
use App\Models\Employee;
use App\Models\ClientProject;
use Inertia\Inertia;
use Illuminate\Http\Request;

class HRMSController extends Controller
{
    public function index()
    {
        return Inertia::render('settings/hrms/page', [
            'stats' => [
                'departments' => Department::count(),
                'employee_types' => EmployeeType::count(),
                'employment_statuses' => EmploymentStatus::count(),
                'shifts' => Shift::count(),
                'leave_categories' => \App\Models\LeaveCategory::count(),
                'holidays' => \App\Models\Holiday::count(),
            ]
        ]);
    }

    public function departments()
    {
        $departments = Department::withCount('employees')
            ->latest()
            ->get()
            ->map(function ($department) {
                return [
                    'id' => $department->id,
                    'name' => $department->name,
                    'description' => $department->description,
                    'employees_count' => $department->employees_count,
                    'created_at' => $department->created_at,
                ];
            });

        return Inertia::render('settings/hrms/departments', [
            'departments' => $departments,
        ]);
    }

    public function employeeTypes()
    {
        $employeeTypes = EmployeeType::withCount('employees')
            ->latest()
            ->get();

        return Inertia::render('settings/hrms/employee-types', [
            'employeeTypes' => $employeeTypes,
        ]);
    }

    public function employmentStatuses()
    {
        $employmentStatuses = EmploymentStatus::withCount('employees')
            ->latest()
            ->get();

        return Inertia::render('settings/hrms/employment-statuses', [
            'employmentStatuses' => $employmentStatuses,
        ]);
    }

    public function shifts()
    {
        $shifts = Shift::withCount('employees')
            ->latest()
            ->get();

        return Inertia::render('settings/hrms/shifts', [
            'shifts' => $shifts,
        ]);
    }

    public function storeShift(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:shifts,name',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'description' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'radius' => 'nullable|integer|min:10|max:5000',
        ]);

        Shift::create($validated);

        return back()->with('success', 'Shift berhasil dibuat');
    }

    public function updateShift(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:shifts,name,' . $shift->id,
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'description' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'radius' => 'nullable|integer|min:10|max:5000',
        ]);

        $shift->update($validated);

        return back()->with('success', 'Shift berhasil diperbarui');
    }

    public function destroyShift(Shift $shift)
    {
        // Check if there are employees assigned to this shift
        if ($shift->employees()->count() > 0) {
            return back()->with('error', 'Tidak dapat menghapus shift yang masih digunakan oleh karyawan');
        }

        $shift->delete();

        return back()->with('success', 'Shift berhasil dihapus');
    }

    public function assignShift()
    {
        $shifts = Shift::select('id', 'name', 'start_time', 'end_time')->get();
        $employees = Employee::select('id', 'full_name as name', 'employee_code as employee_id')
            ->with(['shift:id,name', 'department:id,name'])
            ->get();
        $projects = ClientProject::select('id', 'name', 'code', 'client_id')
            ->where('status', 'won')
            ->with(['assignedEmployees:id,full_name'])
            ->get();

        return Inertia::render('settings/hrms/assign-shifts', [
            'shifts' => $shifts,
            'employees' => $employees,
            'projects' => $projects,
        ]);
    }

    public function bulkAssignShift(Request $request)
    {
        $validated = $request->validate([
            'shift_id' => 'required|exists:shifts,id',
            'assignment_type' => 'required|in:individual,project',
            'employee_ids' => 'required_if:assignment_type,individual|array',
            'employee_ids.*' => 'exists:employees,id',
            'project_id' => 'required_if:assignment_type,project|exists:client_projects,id',
        ]);

        $shift = Shift::findOrFail($validated['shift_id']);

        if ($validated['assignment_type'] === 'project') {
            // Get employees from project
            $project = ClientProject::findOrFail($validated['project_id']);
            $employeeIds = $project->assignedEmployees()->pluck('employees.id')->toArray();

            if (empty($employeeIds)) {
                return back()->with('error', 'Proyek ini tidak memiliki karyawan yang ditugaskan');
            }

            // Also assign shift to project for location inheritance
            $existingShiftProject = ShiftProject::where('shift_id', $shift->id)
                ->where('client_project_id', $project->id)
                ->first();

            if (!$existingShiftProject) {
                ShiftProject::create([
                    'name' => $shift->name . ' - ' . $project->name,
                    'shift_id' => $shift->id,
                    'client_project_id' => $project->id,
                ]);
            }
        } else {
            $employeeIds = $validated['employee_ids'] ?? [];

            if (empty($employeeIds)) {
                return back()->with('error', 'Pilih minimal satu karyawan');
            }
        }

        // Assign shift to employees
        $assignedCount = 0;
        foreach ($employeeIds as $employeeId) {
            $employee = Employee::find($employeeId);
            if ($employee) {
                $employee->update(['shift_id' => $shift->id]);
                $assignedCount++;
            }
        }

        if ($assignedCount === 0) {
            return back()->with('error', 'Tidak ada karyawan yang berhasil ditugaskan');
        }

        $message = 'Shift berhasil diterapkan ke ' . $assignedCount . ' karyawan';
        if ($validated['assignment_type'] === 'project') {
            $message .= ' dari proyek ' . $project->name;
        }

        return back()->with('success', $message);
    }    public function assignShiftToProject(Request $request)
    {
        $validated = $request->validate([
            'shift_id' => 'required|exists:shifts,id',
            'project_id' => 'required|exists:client_projects,id',
        ]);

        // Check if assignment already exists
        $existingAssignment = ShiftProject::where('shift_id', $validated['shift_id'])
            ->where('client_project_id', $validated['project_id'])
            ->first();

        if ($existingAssignment) {
            return back()->with('error', 'Shift sudah diterapkan ke proyek ini');
        }

        // Create shift-project assignment
        $shift = Shift::findOrFail($validated['shift_id']);
        $project = ClientProject::findOrFail($validated['project_id']);

        ShiftProject::create([
            'name' => $shift->name . ' - ' . $project->name,
            'shift_id' => $validated['shift_id'],
            'client_project_id' => $validated['project_id'],
        ]);

        return back()->with('success', 'Shift berhasil diterapkan ke proyek');
    }

    public function removeShiftFromProject(Request $request)
    {
        $validated = $request->validate([
            'shift_id' => 'required|exists:shifts,id',
            'project_id' => 'required|exists:client_projects,id',
        ]);

        $deleted = ShiftProject::where('shift_id', $validated['shift_id'])
            ->where('client_project_id', $validated['project_id'])
            ->delete();

        if ($deleted) {
            return back()->with('success', 'Shift berhasil dihapus dari proyek');
        }

        return back()->with('error', 'Assignment shift tidak ditemukan');
    }
}
