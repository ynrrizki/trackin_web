<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeBpjs;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use App\Exports\EmployeesExport;
use Maatwebsite\Excel\Facades\Excel;


class EmployeeController extends Controller
{
    public function index()
    {
        $query = Employee::query();

        // Search functionality
        if ($search = request('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', '%' . $search . '%')
                  ->orWhere('employee_code', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }

        // Department filter
        if ($departmentId = request('department_id')) {
            $query->where('department_id', $departmentId);
        }

        // Position filter
        if ($positionId = request('position_id')) {
            $query->where('position_id', $positionId);
        }

        // Position Level filter
        if ($levelId = request('level_id')) {
            $query->where('level_id', $levelId);
        }

        // Employee Type filter
        if ($employeeTypeId = request('employee_type_id')) {
            $query->where('employee_type_id', $employeeTypeId);
        }

        // Employment Status filter
        if ($employmentStatusId = request('employment_status_id')) {
            $query->where('employment_status_id', $employmentStatusId);
        }

        // Status filter (active, inactive, etc.)
        if ($status = request('status')) {
            $query->where('status', $status);
        }

        // Employee category filter (internal/outsourcing)
        if ($category = request('category')) {
            if ($category === 'internal') {
                $query->whereNull('outsourcing_field_id');
            } elseif ($category === 'outsourcing') {
                $query->whereNotNull('outsourcing_field_id');
            }
        }

        // Outsourcing Field filter
        if ($outsourcingFieldId = request('outsourcing_field_id')) {
            $query->where('outsourcing_field_id', $outsourcingFieldId);
        }

        // Date range filters
        if ($joinDateFrom = request('join_date_from')) {
            $query->where('join_date', '>=', $joinDateFrom);
        }

        if ($joinDateTo = request('join_date_to')) {
            $query->where('join_date', '<=', $joinDateTo);
        }

        // Salary range filters
        if ($salaryFrom = request('salary_from')) {
            $query->where('basic_salary', '>=', $salaryFrom);
        }

        if ($salaryTo = request('salary_to')) {
            $query->where('basic_salary', '<=', $salaryTo);
        }

        // Apply eager loading and pagination
        $data = $query->with([
                'position',
                'department',
                'positionLevel',
                'outsourceField',
                'employeeType',
                'employmentStatus'
            ])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        // Get filter options for dropdowns
        $filterOptions = $this->getFilterOptions();

        $stats = [
            'totalEmployees' => Employee::count(),
            'activeEmployees' => Employee::active()->count(),
            'leaveEmployees' => Employee::onLeave()->count(),
            'internalEmployees' => Employee::whereNull('outsourcing_field_id')->count(),
            'outsourcingEmployees' => Employee::whereNotNull('outsourcing_field_id')->count(),
        ];

        // Get current filters
        $filters = request()->only([
            'search', 'department_id', 'position_id', 'level_id',
            'employee_type_id', 'employment_status_id', 'status',
            'category', 'outsourcing_field_id', 'join_date_from',
            'join_date_to', 'salary_from', 'salary_to'
        ]);

        return Inertia::render('hrms/employee/page', compact('data', 'stats', 'filterOptions', 'filters'));
    }

    /**
     * Get filter options for dropdowns
     */
    private function getFilterOptions()
    {
        return [
            'departments' => \App\Models\Department::select('id', 'name')
                ->orderBy('name')
                ->get(),
            'positions' => \App\Models\Position::select('id', 'name')
                ->orderBy('name')
                ->get(),
            'positionLevels' => \App\Models\PositionLevel::select('id', 'name')
                ->orderBy('name')
                ->get(),
            'employeeTypes' => \App\Models\EmployeeType::select('id', 'name')
                ->orderBy('name')
                ->get(),
            'employmentStatuses' => \App\Models\EmploymentStatus::select('id', 'name')
                ->orderBy('name')
                ->get(),
            'outsourcingFields' => \App\Models\OutsourcingField::select('id', 'name')
                ->orderBy('name')
                ->get(),
            'statuses' => [
                ['value' => Employee::STATUS_ACTIVE, 'label' => 'Active'],
                ['value' => Employee::STATUS_INACTIVE, 'label' => 'Inactive'],
                ['value' => Employee::STATUS_ON_LEAVE, 'label' => 'On Leave'],
                ['value' => Employee::STATUS_RESIGNED, 'label' => 'Resigned'],
                ['value' => Employee::STATUS_TERMINATED, 'label' => 'Terminated'],
            ],
            'categories' => [
                ['value' => 'internal', 'label' => 'Internal'],
                ['value' => 'outsourcing', 'label' => 'Outsourcing'],
            ],
        ];
    }

    public function create()
    {
        return Inertia::render('hrms/employee/form-create');
    }

    /**
     * Display the specified employee.
     */
    public function show(Employee $employee)
    {
        $employee->load([
            'position',
            'positionLevel',
            'department',
            'employmentStatus',
            'employeeType',
            'outsourcingField',
            'emergencyContacts',
            'bankAccounts',
            'bodyProfile',
            'bpjs',
            'taxStatus'
        ]);

        // Get recent attendance data for the last 7 days
        $recentAttendances = $employee->attendances()
            ->where('date', '>=', now()->subDays(7))
            ->orderBy('date', 'desc')
            ->get();

        // Transform to match EmployeeDetail type structure
        $employeeData = [
            'id' => $employee->id,
            'user_id' => $employee->user_id,
            'employee_code' => $employee->employee_code,
            'full_name' => $employee->full_name,
            'email' => $employee->email,
            'phone' => $employee->phone,
            'identity_number' => $employee->identity_number,
            'kk_number' => $employee->kk_number,
            'address' => $employee->address,
            'postal_code' => $employee->postal_code,
            'birth_date' => $employee->birth_date,
            'religion' => $employee->religion,
            'gender' => $employee->gender,
            'marital_status' => $employee->marital_status,
            'mothermaiden_name' => $employee->mothermaiden_name,
            'spouse_name' => $employee->spouse_name,
            'spouse_phone' => $employee->spouse_phone,
            'place_of_birth' => $employee->place_of_birth,
            'last_education' => $employee->last_education,
            'join_date' => $employee->join_date,
            'end_date' => $employee->end_date,
            'approval_line' => $employee->approval_line,
            'basic_salary' => $employee->basic_salary,
            'status' => $employee->status,
            'photo_url' => $employee->photo_url,
            'position' => $employee->position,
            'position_level' => $employee->positionLevel,
            'employment_status' => $employee->employmentStatus,
            'employee_type' => $employee->employeeType,
            'outsourcing_field' => $employee->outsourcingField,
            'emergency_contacts' => $employee->emergencyContacts->map(function ($contact) {
                return [
                    'name' => $contact->name,
                    'relationship' => $contact->relationship,
                    'phone' => $contact->phone,
                ];
            })->toArray(),
            'bank_accounts' => $employee->bankAccounts->map(function ($account) {
                return [
                    'name' => $account->name,
                    'account_number' => $account->account_number,
                    'account_name' => $account->account_name,
                    'bank_code' => $account->bank_code,
                    'bank_branch' => $account->bank_branch,
                ];
            })->toArray(),
            'bpjs' => $employee->bpjs ? $employee->bpjs->map(function ($bpjs) {
                return [
                    'bpjs_type' => $bpjs->bpjs_type,
                    'participant_number' => $bpjs->participant_number,
                    'contribution_type' => $bpjs->contribution_type,
                ];
            })->toArray() : [],
            'tax_status' => $employee->taxStatus ? [
                'ptkp_code' => $employee->taxStatus->ptkp_code,
                'is_spouse_working' => $employee->taxStatus->is_spouse_working,
                'npwp' => $employee->taxStatus->npwp,
            ] : null,
            'recent_attendances' => $recentAttendances->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'date' => $attendance->date,
                    'time_in' => $attendance->time_in,
                    'time_out' => $attendance->time_out,
                    'latlot_in' => $attendance->latlot_in,
                    'latlot_out' => $attendance->latlot_out,
                    'is_fake_map_detected' => $attendance->is_fake_map_detected,
                ];
            })->toArray(),
            'body_profile' => $employee->bodyProfile ? [
                'height' => $employee->bodyProfile->height,
                'weight' => $employee->bodyProfile->weight,
                'blood_type' => $employee->bodyProfile->blood_type,
                'shirt_size' => $employee->bodyProfile->shirt_size,
                'shoe_size' => $employee->bodyProfile->shoe_size,
                'health_notes' => $employee->bodyProfile->health_notes,
            ] : null,
        ];

        return Inertia::render('hrms/employee/detail', ['employee' => $employeeData]);
    }

    /**
     * Show the form for editing the specified employee.
     */
    public function edit(Employee $employee)
    {
        $employee->load([
            'position',
            'positionLevel',
            'department',
            'employmentStatus',
            'employeeType',
            'outsourcingField',
            'emergencyContacts',
            'bankAccounts',
            'bodyProfile',
            'bpjs',
            'taxStatus'
        ]);

        // Transform to match EmployeeFormType structure
        $employeeData = [
            'id' => $employee->id,
            'user_id' => $employee->user_id,
            'employee_code' => $employee->employee_code,
            'full_name' => $employee->full_name,
            'email' => $employee->email,
            'phone' => $employee->phone,
            'identity_number' => $employee->identity_number,
            'kk_number' => $employee->kk_number,
            'address' => $employee->address,
            'postal_code' => $employee->postal_code,
            'birth_date' => $employee->birth_date,
            'religion' => $employee->religion,
            'gender' => $employee->gender,
            'marital_status' => $employee->marital_status,
            'mothermaiden_name' => $employee->mothermaiden_name,
            'spouse_name' => $employee->spouse_name,
            'spouse_phone' => $employee->spouse_phone,
            'place_of_birth' => $employee->place_of_birth,
            'last_education' => $employee->last_education,
            'join_date' => $employee->join_date,
            'end_date' => $employee->end_date,
            'position_id' => $employee->position_id,
            'level_id' => $employee->level_id,
            'department_id' => $employee->department_id,
            'employment_status_id' => $employee->employment_status_id,
            'employee_type_id' => $employee->employee_type_id,
            'outsourcing_field_id' => $employee->outsourcing_field_id,
            'approval_line' => $employee->approval_line,
            'basic_salary' => $employee->basic_salary,

            // Emergency contact
            'emergency_contact' => $employee->emergencyContacts->first() ? [
                'name' => $employee->emergencyContacts->first()->name,
                'relationship' => $employee->emergencyContacts->first()->relationship,
                'phone' => $employee->emergencyContacts->first()->phone,
            ] : [
                'name' => null,
                'relationship' => null,
                'phone' => null,
            ],

            // Body profile
            'height' => $employee->bodyProfile?->height,
            'weight' => $employee->bodyProfile?->weight,
            'blood_type' => $employee->bodyProfile?->blood_type,
            'shirt_size' => $employee->bodyProfile?->shirt_size,
            'shoe_size' => $employee->bodyProfile?->shoe_size,
            'health_notes' => $employee->bodyProfile?->health_notes,

            // Bank account
            'cash_active' => $employee->bankAccounts->isEmpty(),
            'bank' => $employee->bankAccounts->first() ? [
                'name' => $employee->bankAccounts->first()->name,
                'account_number' => $employee->bankAccounts->first()->account_number,
                'account_name' => $employee->bankAccounts->first()->account_name,
                'bank_code' => $employee->bankAccounts->first()->bank_code,
                'bank_branch' => $employee->bankAccounts->first()->bank_branch,
            ] : [
                'name' => null,
                'account_number' => null,
                'account_name' => null,
                'bank_code' => null,
                'bank_branch' => null,
            ],

            // BPJS data - handle multiple BPJS entries
            'bpjs_kesehatan_active' => $employee->bpjs->where('bpjs_type', 'KS')->isNotEmpty(),
            'bpjs_kesehatan_number' => $employee->bpjs->where('bpjs_type', 'KS')->first()?->participant_number,
            'bpjs_kesehatan_contribution' => $employee->bpjs->where('bpjs_type', 'KS')->first()?->contribution_type,
            'bpjs_ketenagakerjaan_active' => $employee->bpjs->where('bpjs_type', 'TK')->isNotEmpty(),
            'bpjs_ketenagakerjaan_number' => $employee->bpjs->where('bpjs_type', 'TK')->first()?->participant_number,
            'bpjs_ketenagakerjaan_contribution' => $employee->bpjs->where('bpjs_type', 'TK')->first()?->contribution_type,

            // Tax status
            'ptkp_code' => $employee->taxStatus?->ptkp_code,
            'npwp' => $employee->taxStatus?->npwp,
            'is_spouse_working' => $employee->taxStatus?->is_spouse_working ?? false,
        ];

        return Inertia::render('hrms/employee/form-edit', ['employee' => $employeeData]);
    }

    /**
     * Show the bulk employee import page.
     */
    public function bulk()
    {
        return Inertia::render('hrms/employee/bulk');
    }

    /**
     * Clear all filters and redirect to index
     */
    public function clearFilters()
    {
        return redirect()->route('hrms.employees.index');
    }
}
