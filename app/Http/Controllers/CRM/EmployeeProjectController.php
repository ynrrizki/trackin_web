<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\ClientProject;
use App\Models\Employee;
use App\Models\EmployeeProject;
use App\Models\OutsourcingField;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = EmployeeProject::with(['employee.position', 'employee.level', 'employee.department', 'employee.outsourceField', 'project.client'])
            ->latest();

        // Search functionality
        if ($request->search) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('full_name', 'like', '%' . $request->search . '%')
                  ->orWhere('employee_code', 'like', '%' . $request->search . '%');
            })->orWhereHas('project', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by project
        if ($request->project_id) {
            $query->where('project_id', $request->project_id);
        }

        // Filter by outsourcing field
        if ($request->outsourcing_field_id) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('outsourcing_field_id', $request->outsourcing_field_id);
            });
        }

        $employeeProjects = $query->paginate(15)->appends($request->query());

        // Statistics
        $totalAssignments = EmployeeProject::count();
        $activeProjects = EmployeeProject::whereHas('project', function ($q) {
            $q->where('status', 'won');
        })->count();
        $tenderProjects = EmployeeProject::whereHas('project', function ($q) {
            $q->where('status', 'tender');
        })->count();
        $uniqueEmployees = EmployeeProject::distinct('employee_id')->count();

        // Master data for filters
        $projects = ClientProject::select('id', 'name', 'code')->where('status', 'won')->get();
        $outsourcingFields = OutsourcingField::select('id', 'name')->get();

        return Inertia::render('crm/employee-project/page', [
            'employeeProjects' => $employeeProjects,
            'filters' => $request->only(['search', 'project_id', 'outsourcing_field_id']),
            'statistics' => [
                'total_assignments' => $totalAssignments,
                'active_projects' => $activeProjects,
                'tender_projects' => $tenderProjects,
                'unique_employees' => $uniqueEmployees,
            ],
            'masters' => [
                'projects' => $projects,
                'outsourcing_fields' => $outsourcingFields,
            ]
        ]);
    }

    public function create(Request $request)
    {
        $projects = ClientProject::select('id', 'name', 'code', 'outsourcing_field_id')
            ->where('status', 'won') // Only show projects that won the tender
            ->with('outsourceField')
            ->get();

        $outsourcingFields = OutsourcingField::select('id', 'name')->get();        // If project_id is provided, get available employees for that project's outsourcing field
        $employees = collect();
        if ($request->project_id) {
            $project = ClientProject::findOrFail($request->project_id);
            $query = Employee::select('id', 'employee_code', 'full_name', 'outsourcing_field_id')
                ->with(['position', 'level', 'outsourceField'])
                ->where('status', 'active')
                ->whereNotIn('id', function ($query) use ($project) {
                    $query->select('employee_id')
                        ->from('employee_projects')
                        ->where('project_id', $project->id);
                });

            // Only filter by outsourcing field if project has one specified
            if ($project->outsourcing_field_id) {
                $query->where('outsourcing_field_id', $project->outsourcing_field_id);
            }

            $employees = $query->get();

            // dd($employees);
        }

        return Inertia::render('crm/employee-project/form-create', [
            'masters' => [
                'projects' => $projects,
                'outsourcing_fields' => $outsourcingFields,
                'employees' => $employees,
            ],
            'selected_project_id' => $request->project_id,
        ]);
    }

    public function getEmployees(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:client_projects,id',
            'outsourcing_field_id' => 'nullable|exists:outsourcing_fields,id',
        ]);

        $project = ClientProject::findOrFail($request->project_id);

        $query = Employee::select('id', 'employee_code', 'full_name', 'outsourcing_field_id')
            ->with(['position', 'level', 'outsourceField'])
            ->where('status', 'active')
            ->whereNotIn('id', function ($query) use ($project) {
                $query->select('employee_id')
                    ->from('employee_projects')
                    ->where('project_id', $project->id);
            });

        // Filter by outsourcing field (either from project or specific filter)
        if ($request->outsourcing_field_id) {
            $query->where('outsourcing_field_id', $request->outsourcing_field_id);
        } elseif ($project->outsourcing_field_id) {
            $query->where('outsourcing_field_id', $project->outsourcing_field_id);
        }

        $employees = $query->get();

        return response()->json([
            'employees' => $employees
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'project_id' => 'required|exists:client_projects,id',
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'required|exists:employees,id',
        ]);

        $project = ClientProject::findOrFail($request->project_id);

        // Check if employees are already assigned to this project
        $existingAssignments = EmployeeProject::where('project_id', $project->id)
            ->whereIn('employee_id', $request->employee_ids)
            ->pluck('employee_id')
            ->toArray();

        if (!empty($existingAssignments)) {
            $employees = Employee::whereIn('id', $existingAssignments)->pluck('full_name')->toArray();
            return back()->withErrors([
                'employee_ids' => 'Karyawan berikut sudah ditugaskan ke projek ini: ' . implode(', ', $employees)
            ]);
        }

        // Create assignments
        $assignments = [];
        foreach ($request->employee_ids as $employeeId) {
            $assignments[] = [
                'project_id' => $project->id,
                'employee_id' => $employeeId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        EmployeeProject::insert($assignments);

        return redirect()->route('crm.employee-projects.index')
            ->with('success', 'Berhasil menugaskan ' . count($request->employee_ids) . ' karyawan ke projek ' . $project->name);
    }

    public function show(EmployeeProject $employeeProject)
    {
        $employeeProject->load(['employee.position', 'employee.level', 'employee.department', 'employee.outsourceField', 'project.client']);

        return Inertia::render('crm/employee-project/detail', [
            'employeeProject' => $employeeProject,
        ]);
    }

    public function destroy(EmployeeProject $employeeProject)
    {
        $projectName = $employeeProject->project->name;
        $employeeName = $employeeProject->employee->full_name;

        $employeeProject->delete();

        return back()->with('success', "Berhasil menghapus penugasan {$employeeName} dari projek {$projectName}");
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|exists:employee_projects,id',
        ]);

        EmployeeProject::whereIn('id', $request->ids)->delete();

        return back()->with('success', 'Berhasil menghapus ' . count($request->ids) . ' penugasan karyawan');
    }
}
