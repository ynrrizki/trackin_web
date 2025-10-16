<?php

namespace App\Http\Controllers\Api\V1\HRMS;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\EmployeeBpjs;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EmployeeController extends Controller
{
    /**
     * Paginated employee directory for mobile: peers (all), same division, subordinates, or superiors.
     * Query params:
     * - category: all|division|subordinates|superiors (default: all)
     * - q: search query (full_name, employee_code, email)
     * - department_id: optional filter by department
     * - page, per_page
     */
    public function directory(Request $request)
    {
        $user = $request->user();
        $you = Employee::where('user_id', $user->id)->first();
        if (!$you) {
            return $this->respondError('Employee not found', 404);
        }

        $category = $request->query('category', 'all');
        $q = trim((string) $request->query('q', ''));
        $departmentId = $request->query('department_id');
        $outsourcingFieldId = $request->query('outsourcing_field_id');
        $projectEmployeeRaw = $request->query('project_employee');
        $projectEmployee = is_null($projectEmployeeRaw)
            ? null
            : filter_var($projectEmployeeRaw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $projectId = $request->query('project_id');
        $perPage = (int) $request->query('per_page', 20);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 20;

        $baseSelect = [
            'id',
            'employee_code',
            'full_name',
            'email',
            'phone',
            'position_id',
            'department_id',
            'employment_status_id',
            'employee_type_id',
            'outsourcing_field_id',
            'approval_line',
        ];

    $query = Employee::with(['position', 'department', 'employmentStatus', 'employeeType', 'outsourcingField'])
            ->active();

        // Category filters
        switch ($category) {
            case 'division':
                if ($you->department_id) {
                    $query->where('department_id', $you->department_id)
                          ->where('id', '<>', $you->id);
                } else {
                    $query->whereRaw('1 = 0'); // no division info, return empty
                }
                break;
            case 'subordinates':
                $query->where('approval_line', $you->employee_code);
                break;
            case 'superiors':
                if ($you->approval_line) {
                    $query->where('employee_code', $you->approval_line);
                } else {
                    $query->whereRaw('1 = 0');
                }
                break;
            case 'all':
            default:
                $query->where('id', '<>', $you->id);
                break;
        }

        // Additional filters
        if (!empty($q)) {
            $query->where(function ($qb) use ($q) {
                $qb->where('full_name', 'like', "%$q%")
                   ->orWhere('employee_code', 'like', "%$q%")
                   ->orWhere('email', 'like', "%$q%");
            });
        }
        if (!empty($departmentId)) {
            $query->where('department_id', $departmentId);
        }
        if (!empty($outsourcingFieldId)) {
            $query->where('outsourcing_field_id', $outsourcingFieldId);
        }
        if ($projectEmployee === true) {
            $query->whereHas('assignedProjects');
        } elseif ($projectEmployee === false) {
            $query->whereDoesntHave('assignedProjects');
        }
        if (!empty($projectId)) {
            $query->whereHas('assignedProjects', function ($qp) use ($projectId) {
                $qp->where('client_projects.id', $projectId);
            });
        }

        $query->orderBy('full_name');

        $paginator = $query->paginate($perPage)->appends($request->query());

        $items = collect($paginator->items())->map(function ($emp) {
            return [
                'id' => $emp->id,
                'employee_code' => $emp->employee_code,
                'full_name' => $emp->full_name,
                'email' => $emp->email,
                'phone' => $emp->phone,
                'position' => optional($emp->position)->name,
                'department' => optional($emp->department)->name,
                'employment_status' => optional($emp->employmentStatus)->name,
                'employee_type' => optional($emp->employeeType)->name,
                'outsourcing_field' => optional($emp->outsourcingField)->name,
            ];
        })->values();

        return $this->respondSuccess([
            'items' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'has_more' => $paginator->hasMorePages(),
                'category' => $category,
            ],
        ]);
    }

    public function getEmployeeRequester()
    {
        $user = request()->user();
        $you = Employee::where('user_id', $user->id)->first();
        if (!$you) {
            return $this->respondError('Employee not found', 404);
        }

        $employee = Employee::with([
            'position',
            'department',
            'employmentStatus',
            'employeeType',
            'outsourcingField',
        ])->where('approval_line', $you->employee_code)
            ->active()
            ->orderBy('created_at', 'desc')
            ->get([
                'id',
                'employee_code',
                'full_name',
                'email',
                'phone',
                'position_id',
                'department_id',
                'employment_status_id',
                'employee_type_id',
                'outsourcing_field_id',
            ])->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'employee_code' => $emp->employee_code,
                    'full_name' => $emp->full_name,
                    'email' => $emp->email,
                    'phone' => $emp->phone,
                    'position' => $emp->position ? $emp->position->name : null,
                    'department' => $emp->department ? $emp->department->name : null,
                    'employment_status' => $emp->employmentStatus ? $emp->employmentStatus->name : null,
                    'employee_type' => $emp->employeeType ? $emp->employeeType->name : null,
                    'outsourcing_field' => $emp->outsourcingField ? $emp->outsourcingField->name : null,
                ];
            });

        return $this->respondSuccess($employee);
    }

    public function show($id)
    {
        $employee = Employee::find($id);

        if (!$employee) {
            return $this->respondError('Employee not found', 404);
        }

        return $this->respondSuccess($employee);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $employee = Employee::with([
            'bpjs',
            'taxStatus',
            'bankAccounts',
        ])
            ->where('user_id', $user->id)
            ->select([
                'id',
                'user_id',
                'employee_code',
                'full_name',
                'email',
                'phone',
                'identity_number',
                'kk_number',
                'address',
                'postal_code',
                'birth_date',
                'religion',
                'gender',
                'mothermaiden_name',
                'marital_status',
                'spouse_name',
                'spouse_phone',
                'place_of_birth',
                'last_education',
                'photo_url',
            ])
            ->first();

        if (!$employee) {
            return $this->respondError('Employee not found', 404);
        }

        // This is a patch method for updatating employee details, this is don't have required fields
        $data = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'sometimes|string|max:20',
            'identity_number' => 'sometimes|string|max:50',
            'kk_number' => 'sometimes|string|max:50',
            'address' => 'sometimes|string|max:500',
            'postal_code' => 'sometimes|string|max:20',
            'birth_date' => 'sometimes|date',
            'religion' => 'sometimes|in:Islam,Katolik,Kristen,Buddha,Hindu,Confucius,Others',
            'gender' => 'sometimes|in:MALE,FEMALE',
            'mothermaiden_name' => 'sometimes|string|max:255',
            'marital_status' => 'sometimes|in:SINGLE,MARRIED,WIDOW,WIDOWER',
            'spouse_name' => 'sometimes|string|max:255',
            'spouse_phone' => 'sometimes|string|max:20',
            'place_of_birth' => 'sometimes|string|max:255',
            'last_education' => 'sometimes|string|max:255',
            'photo_url' => 'sometimes',
            // EmployeeBpjs
            'bpjs_ks_number' => 'sometimes|string|max:50',
            'bpjs_tk_number' => 'sometimes|string|max:50',
            // EmployeeTax
            'npwp' => 'sometimes|string|max:50',
            'ptkp_code' => 'sometimes|string|max:10',
            'is_spouse_working' => 'sometimes|boolean',
            // Employee Bank Account
            'bank.name' => 'sometimes|string|max:100',
            'bank.account_number' => 'sometimes|string|max:50',
            'bank.account_name' => 'sometimes|string|max:100',
            'bank.branch' => 'sometimes|string|max:100',
            'bank.code' => 'sometimes|string|max:10',
        ]);

        if (isset($data['full_name']))
            $employee->full_name = $data['full_name'];
        if (isset($data['email']))
            $employee->email = $data['email'];
        if (isset($data['phone']))
            $employee->phone = $data['phone'];
        if (isset($data['identity_number']))
            $employee->identity_number = $data['identity_number'];
        if (isset($data['kk_number']))
            $employee->kk_number = $data['kk_number'];
        if (isset($data['address']))
            $employee->address = $data['address'];
        if (isset($data['postal_code']))
            $employee->postal_code = $data['postal_code'];
        if (isset($data['birth_date']))
            $employee->birth_date = $data['birth_date'];
        if (isset($data['religion']))
            $employee->religion = $data['religion'];
        if (isset($data['gender']))
            $employee->gender = $data['gender'];
        if (isset($data['mothermaiden_name']))
            $employee->mothermaiden_name = $data['mothermaiden_name'];
        if (isset($data['marital_status']))
            $employee->marital_status = $data['marital_status'];
        if (isset($data['spouse_name']))
            $employee->spouse_name = $data['spouse_name'];
        if (isset($data['spouse_phone']))
            $employee->spouse_phone = $data['spouse_phone'];
        if (isset($data['place_of_birth']))
            $employee->place_of_birth = $data['place_of_birth'];
        if (isset($data['last_education']))
            $employee->last_education = $data['last_education'];
        if (isset($data['photo_url']))
            $employee->photo_url = $data['photo_url'];

        // Update Employee BPJS
        if (isset($data['bpjs_ks_number']))
            $employee->bpjs()->updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'bpjs_type' => EmployeeBpjs::BPJS_TYPE_KS
                ],
                ['participant_number' => $data['bpjs_ks_number']]
            )->save();
        if (isset($data['bpjs_tk_number']))
            $employee->bpjs()->updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'bpjs_type' => EmployeeBpjs::BPJS_TYPE_TK
                ],
                ['participant_number' => $data['bpjs_tk_number']]
            )->save();
        // Update Employee Tax
        // $employee->npwp = $data['npwp'];
        // $employee->ptkp_code = $data['ptkp_code'];
        if (isset($data['npwp']))
            $employee->taxStatus()->updateOrCreate(
                [
                    'employee_id' => $employee->id
                ],
                [
                    'npwp' => $data['npwp'],
                ]
            )->save();
        if (isset($data['ptkp_code']))
            $employee->taxStatus()->updateOrCreate(
                [
                    'employee_id' => $employee->id
                ],
                [
                    'ptkp_code' => $data['ptkp_code'],
                ]
            )->save();
        if (isset($data['is_spouse_working']))
            $employee->taxStatus()->updateOrCreate(
                [
                    'employee_id' => $employee->id
                ],
                [
                    'is_spouse_working' => $data['is_spouse_working'],
                ]
            )->save();
        // Update Employee Bank Account
        // $employee->bank_name = $data['bank_name'];
        // $employee->bank_account_number = $data['bank_account_number'];
        // $employee->bank_account_name = $data['bank_account_name'];
        // $employee->bank_branch = $data['bank_branch'];
        // $employee->bank_code = $data['bank_code'];
        if (isset($data['bank']))
            $employee->bankAccounts()->updateOrCreate(
                [
                    'employee_id' => $employee->id
                ],
                [
                    'name' => $data['bank']['name'],
                    'account_number' => $data['bank']['account_number'],
                    'account_name' => $data['bank']['account_name'],
                    'bank_branch' => $data['bank']['branch'] ?? null,
                    'bank_code' => $data['bank']['code'] ?? null,
                ]
            )->save();

        $employee->save();


        return $this->respondSuccess(
            [
                'id' => $employee->id,
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
                'mothermaiden_name' => $employee->mothermaiden_name,
                'marital_status' => $employee->marital_status,
                'spouse_name' => $employee->spouse_name,
                'spouse_phone' => $employee->spouse_phone,
                'place_of_birth' => $employee->place_of_birth,
                'last_education' => $employee->last_education,
                'photo_url' => $employee->photo_url,
                'bpjs' => $employee->bpjs?->first(),
                'tax_status' => $employee->taxStatus?->first(),
                'bank_accounts' => $employee->bankAccounts?->first(),
            ],
            message: 'Employee updated successfully',
        );
    }

    /**
     * Update employee shift assignment
     */
    public function updateShiftAssignment(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'sometimes|exists:employees,id',
            'employee_code' => 'sometimes|exists:employees,employee_code',
            'shift_id' => 'required|exists:shifts,id',
            'effective_date' => 'sometimes|date',
        ]);

        // Get employee by ID or employee_code
        if (isset($validated['employee_id'])) {
            $employee = Employee::find($validated['employee_id']);
        } else if (isset($validated['employee_code'])) {
            $employee = Employee::where('employee_code', $validated['employee_code'])->first();
        } else {
            // Get current logged in employee
            $user = $request->user();
            $employee = Employee::where('user_id', $user->id)->first();
        }

        if (!$employee) {
            return $this->respondError('Employee not found', 404);
        }

        // Store old shift for tracking
        $oldShiftId = $employee->shift_id;

        // Update shift assignment
        $employee->update(['shift_id' => $validated['shift_id']]);

        // Optionally create assignment record for tracking
        if (class_exists('App\Models\ShiftAssignment')) {
            \App\Models\ShiftAssignment::create([
                'employee_id' => $employee->id,
                'shift_id' => $validated['shift_id'],
                'effective_date' => $validated['effective_date'] ?? now()->toDateString(),
            ]);
        }

        return $this->respondSuccess([
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->full_name,
                'employee_code' => $employee->employee_code,
                'old_shift_id' => $oldShiftId,
                'new_shift_id' => $validated['shift_id'],
            ],
            'shift' => $employee->fresh(['shift'])->shift,
        ], false, 'Shift assignment updated successfully');
    }

    /**
     * Bulk update shift assignment for multiple employees
     */
    public function bulkUpdateShiftAssignment(Request $request)
    {
        $validated = $request->validate([
            'shift_id' => 'required|exists:shifts,id',
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'effective_date' => 'sometimes|date',
        ]);

        $updatedEmployees = [];
        $failedEmployees = [];

        foreach ($validated['employee_ids'] as $employeeId) {
            $employee = Employee::find($employeeId);

            if ($employee) {
                $oldShiftId = $employee->shift_id;
                $employee->update(['shift_id' => $validated['shift_id']]);

                // Create assignment record for tracking
                if (class_exists('App\Models\ShiftAssignment')) {
                    \App\Models\ShiftAssignment::create([
                        'employee_id' => $employee->id,
                        'shift_id' => $validated['shift_id'],
                        'effective_date' => $validated['effective_date'] ?? now()->toDateString(),
                    ]);
                }

                $updatedEmployees[] = [
                    'id' => $employee->id,
                    'name' => $employee->full_name,
                    'employee_code' => $employee->employee_code,
                    'old_shift_id' => $oldShiftId,
                    'new_shift_id' => $validated['shift_id'],
                ];
            } else {
                $failedEmployees[] = $employeeId;
            }
        }

        return $this->respondSuccess([
            'updated_count' => count($updatedEmployees),
            'failed_count' => count($failedEmployees),
            'updated_employees' => $updatedEmployees,
            'failed_employee_ids' => $failedEmployees,
            'shift_id' => $validated['shift_id'],
        ], false, 'Bulk shift assignment completed');
    }
}
