<?php

namespace App\Http\Controllers\Api\HRMS;

use App\Exports\EmployeesExport;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeBpjs;
use App\Exports\BulkEmployeeTemplateExport;
use App\Imports\BulkEmployeeImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class EmployeeApiController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Employee::with(['position', 'department', 'employmentStatus', 'employeeType']);

            // Search functionality
            if ($request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('full_name', 'like', '%' . $request->search . '%')
                        ->orWhere('email', 'like', '%' . $request->search . '%')
                        ->orWhere('employee_id', 'like', '%' . $request->search . '%');
                });
            }

            // Filter by department
            if ($request->department_id) {
                $query->where('department_id', $request->department_id);
            }

            // Filter by position
            if ($request->position_id) {
                $query->where('position_id', $request->position_id);
            }

            // Filter by employment status
            if ($request->employment_status_id) {
                $query->where('employment_status_id', $request->employment_status_id);
            }

            // Pagination
            $perPage = $request->per_page ?? 15;
            $employees = $query->latest()->paginate($perPage);

            return $this->respondSuccess($employees, true, 'Employees retrieved successfully');

        } catch (\Exception $e) {
            return $this->respondError500('Failed to retrieve employees');
        }
    }

    public function show(Employee $employee)
    {
        try {
            $employee->load([
                'position',
                'positionLevel',
                'department',
                'employmentStatus',
                'employeeType',
                'outsourcingField',
                'emergencyContacts',
                'bankAccounts',
                'bpjs',
                'taxStatus'
            ]);

            return $this->respondSuccess($employee, false, 'Employee retrieved successfully');

        } catch (\Exception $e) {
            return $this->respondError500('Failed to retrieve employee');
        }
    }

    public function store(Request $request)
    {
        try {
            // Basic flag validation first
            $request->validate([
                'cash_active' => 'boolean',
                'bpjs_kesehatan_active' => 'boolean',
                'bpjs_ketenagakerjaan_active' => 'boolean',
                'is_spouse_working' => 'boolean',
            ]);

            $rules = [
                // Step 1: Personal Data
                'full_name' => 'required|string|max:255|min:3',
                'email' => 'required|email|unique:employees,email',
                'phone' => 'required|string|max:30',
                'identity_number' => 'nullable|string|max:255',
                'kk_number' => 'nullable|string|max:255',
                'address' => 'required|string',
                'postal_code' => 'nullable|string|max:255',
                'birth_date' => 'required|date',
                'religion' => 'nullable|string|in:Islam,Katolik,Kristen,Buddha,Hindu,Confucius,Others',
                'marital_status' => 'nullable|string|in:SINGLE,MARRIED,WIDOW,WIDOWER',
                'spouse_name' => 'nullable|string|max:255',
                'spouse_phone' => 'nullable|string|max:30',
                'place_of_birth' => 'nullable|string|max:255',
                'last_education' => 'nullable|string|max:255',
                'mothermaiden_name' => 'nullable|string|max:255',
                'gender' => 'required|string|in:MALE,FEMALE',

                // Emergency Contact (required)
                'emergency_contact.name' => 'required|string|max:255',
                'emergency_contact.relationship' => 'required|string|max:100',
                'emergency_contact.phone' => 'required|string|max:30',

                // Step 2: Employment Data
                'join_date' => 'required|date',
                'end_date' => 'nullable|date',
                'employee_type_id' => 'required|exists:employee_types,id',
                'position_id' => 'nullable|required_if:employee_id,1|exists:positions,id',
                'level_id' => 'required|exists:position_levels,id',
                'department_id' => 'nullable|required_if:employee_type_id,1|exists:departments,id',
                'employment_status_id' => 'required|exists:employment_statuses,id',
                'outsourcing_field_id' => 'nullable|exists:outsourcing_fields,id',
                'approval_line' => 'nullable',

                // Step 3: Payroll & Tax
                'basic_salary' => 'required|numeric|min:0',
                'cash_active' => 'boolean',

                // BPJS
                'bpjs_kesehatan_number' => 'nullable|string|max:100',
                'bpjs_kesehatan_contribution' => 'nullable|string|max:50',
                'bpjs_ketenagakerjaan_number' => 'nullable|string|max:100',
                'bpjs_ketenagakerjaan_contribution' => 'nullable|string|max:50',

                // Tax
                'ptkp_code' => 'required|string|max:20',
                'npwp' => 'nullable|string|max:30',
            ];

            // Conditional bank rules
            if (!$request->boolean('cash_active')) {
                $rules = array_merge($rules, [
                    'bank.name' => 'required|string|max:255',
                    'bank.account_number' => 'required|string|max:100',
                    'bank.account_name' => 'required|string|max:255',
                    'bank.bank_code' => 'nullable|string|max:50',
                    'bank.bank_branch' => 'nullable|string|max:100',
                ]);
            } else {
                $rules = array_merge($rules, [
                    'bank.name' => 'nullable|string|max:255',
                    'bank.account_number' => 'nullable|string|max:100',
                    'bank.account_name' => 'nullable|string|max:255',
                    'bank.bank_code' => 'nullable|string|max:50',
                    'bank.bank_branch' => 'nullable|string|max:100',
                ]);
            }

            $validated = $request->validate($rules);

            \DB::beginTransaction();
            try {
                // Auto generate employee_code if missing
                if (!isset($validated['employee_code'])) {
                    $next = Employee::count() + 1;
                    $validated['employee_code'] = str_pad($next, 5, '0', STR_PAD_LEFT);
                }

                $employee = Employee::create([
                    'employee_code' => $validated['employee_code'],
                    'full_name' => $validated['full_name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'identity_number' => $validated['identity_number'] ?? null,
                    'kk_number' => $validated['kk_number'] ?? null,
                    'address' => $validated['address'],
                    'postal_code' => $validated['postal_code'] ?? null,
                    'birth_date' => $validated['birth_date'],
                    'religion' => $validated['religion'] ?? null,
                    'mothermaiden_name' => $validated['mothermaiden_name'] ?? null,
                    'marital_status' => $validated['marital_status'] ?? 'SINGLE',
                    'gender' => $validated['gender'],
                    'spouse_name' => $validated['spouse_name'] ?? null,
                    'spouse_phone' => $validated['spouse_phone'] ?? null,
                    'place_of_birth' => $validated['place_of_birth'] ?? null,
                    'last_education' => $validated['last_education'] ?? null,
                    'join_date' => $validated['join_date'],
                    'end_date' => $validated['end_date'] ?? null,
                    'position_id' => $validated['position_id'],
                    'level_id' => $validated['level_id'],
                    'department_id' => $validated['department_id'],
                    'employment_status_id' => $validated['employment_status_id'],
                    'employee_type_id' => $validated['employee_type_id'],
                    'outsourcing_field_id' => $validated['outsourcing_field_id'] ?? null,
                    'status' => Employee::STATUS_ACTIVE,
                    'basic_salary' => $validated['basic_salary'] ?? 0,
                    // 'cash_active' => $validated['cash_active'] ?? false,
                    // 'ptkp_code' => $validated['ptkp_code'],
                    'npwp' => $validated['npwp'] ?? null,
                    'is_spouse_working' => $validated['is_spouse_working'] ?? false,
                ]);

                // Emergency Contact
                $employee->emergencyContacts()->create([
                    'name' => $validated['emergency_contact']['name'],
                    'relationship' => $validated['emergency_contact']['relationship'],
                    'phone' => $validated['emergency_contact']['phone'],
                ]);

                // Bank
                if (!$validated['cash_active'] && isset($validated['bank'])) {
                    $employee->bankAccounts()->create([
                        'name' => $validated['bank']['name'] ?? null,
                        'account_number' => $validated['bank']['account_number'] ?? null,
                        'account_name' => $validated['bank']['account_name'] ?? null,
                        'bank_code' => $validated['bank']['bank_code'] ?? null,
                        'bank_branch' => $validated['bank']['bank_branch'] ?? null,
                    ]);
                }

                // BPJS
                if (!empty($validated['bpjs_kesehatan_active'])) {
                    $employee->bpjs()->create([
                        'bpjs_type' => EmployeeBpjs::BPJS_TYPE_KS,
                        'participant_number' => $validated['bpjs_kesehatan_number'] ?? null,
                    ]);
                }
                if (!empty($validated['bpjs_ketenagakerjaan_active'])) {
                    $employee->bpjs()->create([
                        'bpjs_type' => EmployeeBpjs::BPJS_TYPE_TK,
                        'participant_number' => $validated['bpjs_ketenagakerjaan_number'] ?? null,
                    ]);
                }

                // Tax Status
                $employee->taxStatus()->create([
                    'ptkp_code' => $validated['ptkp_code'],
                    'npwp' => $validated['npwp'] ?? null,
                    'is_spouse_working' => $validated['is_spouse_working'] ?? false,
                ]);

                \DB::commit();
                $employee->load(['position', 'department', 'employmentStatus', 'employeeType']);
                return $this->respondCreated($employee, false, 'Employee created successfully');
            } catch (\Exception $e) {
                Log::error('Error creating employee: ' . $e->getMessage(), ['exception' => $e]);
                \DB::rollBack();
                throw $e;
            }
        } catch (ValidationException $e) {
            Log::error('Validation error creating employee: ' . json_encode($e->errors()), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating employee: ' . $e->getMessage(), ['exception' => $e]);
            return $this->respondError500('Failed to create employee');
        }
    }

    public function update(Request $request, Employee $employee)
    {
        try {
            $validatedData = $request->validate([
                // 'employee_id' => 'required|string|unique:employees,employee_id,' . $employee->id,
                'full_name' => 'required|string|max:255',
                'email' => 'required|email|unique:employees,email,' . $employee->id,
                'phone' => 'required|string|max:20',
                'identity_number' => 'required|string|max:20',
                'birth_date' => 'required|date',
                'place_of_birth' => 'required|string|max:100',
                'address' => 'required|string',
                'religion' => 'required|string|max:50',
                'marital_status' => 'required|in:SINGLE,MARRIED,DIVORCED,WIDOW,WIDOWER',
                'position_id' => 'required|exists:positions,id',
                'department_id' => 'required|exists:departments,id',
                'employment_status_id' => 'required|exists:employment_statuses,id',
                'employee_type_id' => 'required|exists:employee_types,id',
                'join_date' => 'required|date',
                'basic_salary' => 'required|numeric|min:0',
            ]);

            $employee->update($validatedData);
            $employee->load(['position', 'department', 'employmentStatus', 'employeeType']);

            return $this->respondSuccess($employee, false, 'Employee updated successfully');

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to update employee');
        }
    }

    public function destroy(Employee $employee)
    {
        try {
            // Check if employee has related records that prevent deletion
            if ($employee->attendances()->count() > 0 || $employee->payslips()->count() > 0) {
                return $this->respondError('Cannot delete employee with existing attendance or payroll records', 400);
            }

            $employee->delete();

            return $this->respondSuccess([], false, 'Employee deleted successfully');

        } catch (\Exception $e) {
            return $this->respondError500('Failed to delete employee');
        }
    }

    // Additional endpoints for employee-specific operations
    public function getEmployeeStats()
    {
        try {
            $user = auth()->user();

            // Check if user has permission to view all employees or just their department
            if ($user->can('employee.view')) {
                $stats = [
                    'total_employees' => Employee::count(),
                    'active_employees' => Employee::where('status', 'active')->count(),
                    'on_leave_employees' => Employee::where('status', 'on_leave')->count(),
                    'terminated_employees' => Employee::where('status', 'terminated')->count(),
                ];
            } else {
                // Return limited stats for users without full permission
                $stats = [
                    'message' => 'Limited access - contact HR for full statistics'
                ];
            }

            return $this->respondSuccess($stats, false, 'Employee statistics retrieved successfully');

        } catch (\Exception $e) {
            return $this->respondError500('Failed to retrieve employee statistics');
        }
    }

    /**
     * Update personal section fields only
     */
    public function updatePersonal(Request $request, Employee $employee)
    {
        try {
            $validated = $request->validate([
                'full_name' => 'sometimes|required|string|max:255|min:3',
                'email' => 'sometimes|required|email|unique:employees,email,' . $employee->id,
                'phone' => 'sometimes|required|string|max:30',
                'identity_number' => 'nullable|string|max:255',
                'kk_number' => 'nullable|string|max:255',
                'address' => 'nullable|string',
                'postal_code' => 'nullable|string|max:255',
                'birth_date' => 'sometimes|required|date',
                'religion' => 'nullable|string|in:Islam,Katolik,Kristen,Buddha,Hindu,Confucius,Others',
                'marital_status' => 'nullable|string|in:SINGLE,MARRIED,WIDOW,WIDOWER',
                'spouse_name' => 'nullable|string|max:255',
                'spouse_phone' => 'nullable|string|max:30',
                'place_of_birth' => 'nullable|string|max:255',
                'last_education' => 'nullable|string|max:255',
                'mothermaiden_name' => 'nullable|string|max:255',
                'gender' => 'nullable|string|in:MALE,FEMALE',

                // Optional nested: emergency contact
                'emergency_contact.name' => 'sometimes|required|string|max:255',
                'emergency_contact.relationship' => 'sometimes|required|string|max:100',
                'emergency_contact.phone' => 'sometimes|required|string|max:30',

                // Optional body profile
                'height' => 'nullable|string|max:20',
                'weight' => 'nullable|string|max:20',
                'blood_type' => 'nullable|in:A,B,AB,O,UNKNOWN',
                'shirt_size' => 'nullable|in:S,M,L,XL,XXL,XXXL,CUSTOM,UNKNOWN',
                'shoe_size' => 'nullable|string|max:20',
                'health_notes' => 'nullable|string',
            ]);

            $employee->fill($validated);
            $employee->save();

            // Upsert first emergency contact if provided
            if ($request->has('emergency_contact')) {
                $ec = $employee->emergencyContacts()->first();
                $ecData = [
                    'name' => data_get($validated, 'emergency_contact.name'),
                    'relationship' => data_get($validated, 'emergency_contact.relationship'),
                    'phone' => data_get($validated, 'emergency_contact.phone'),
                ];
                if ($ec) {
                    $ec->update($ecData);
                } else {
                    // only create if at least name and phone exist
                    if (!empty($ecData['name']) || !empty($ecData['phone'])) {
                        $employee->emergencyContacts()->create($ecData);
                    }
                }
            }

            // Upsert body profile if any of its fields present
            if ($request->hasAny(['height', 'weight', 'blood_type', 'shirt_size', 'shoe_size', 'health_notes'])) {
                $bp = $employee->bodyProfile; // hasOne
                if (!$bp) {
                    $bp = $employee->bodyProfile()->make();
                }
                $bp->height = $validated['height'] ?? $bp->height;
                $bp->weight = $validated['weight'] ?? $bp->weight;
                $bp->blood_type = $validated['blood_type'] ?? $bp->blood_type;
                $bp->shirt_size = $validated['shirt_size'] ?? $bp->shirt_size;
                $bp->shoe_size = $validated['shoe_size'] ?? $bp->shoe_size;
                $bp->health_notes = $validated['health_notes'] ?? $bp->health_notes;
                $employee->bodyProfile()->save($bp);
            }

            $employee->load([
                'position',
                'positionLevel',
                'department',
                'employmentStatus',
                'employeeType',
                'emergencyContacts',
                'bankAccounts',
                'bpjs',
                'taxStatus',
                'bodyProfile'
            ]);
            return $this->respondSuccess($employee, false, 'Personal data updated successfully');
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('updatePersonal error: ' . $e->getMessage(), ['exception' => $e]);
            return $this->respondError500('Failed to update personal data');
        }
    }

    /**
     * Update employment section fields only
     */
    public function updateEmployment(Request $request, Employee $employee)
    {
        try {
            $validated = $request->validate([
                'join_date' => 'sometimes|required|date',
                'end_date' => 'nullable|date',
                'employee_type_id' => 'sometimes|required|exists:employee_types,id',
                'position_id' => 'sometimes|required|exists:positions,id',
                'level_id' => 'sometimes|required|exists:position_levels,id',
                'department_id' => 'nullable|required_if:employee_type_id,1|exists:departments,id',
                'employment_status_id' => 'sometimes|required|exists:employment_statuses,id',
                'outsourcing_field_id' => 'nullable|exists:outsourcing_fields,id',
                'approval_line' => 'nullable',
            ]);

            $employee->fill($validated);
            $employee->save();
            $employee->load([
                'position',
                'positionLevel',
                'department',
                'employmentStatus',
                'employeeType',
                'emergencyContacts',
                'bankAccounts',
                'bpjs',
                'taxStatus',
                'bodyProfile'
            ]);
            return $this->respondSuccess($employee, false, 'Employment data updated successfully');
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('updateEmployment error: ' . $e->getMessage(), ['exception' => $e]);
            return $this->respondError500('Failed to update employment data');
        }
    }

    /**
     * Update payroll/tax section fields only
     */
    public function updatePayroll(Request $request, Employee $employee)
    {
        try {
            $request->validate([
                'cash_active' => 'boolean',
                'bpjs_kesehatan_active' => 'boolean',
                'bpjs_ketenagakerjaan_active' => 'boolean',
                'is_spouse_working' => 'boolean',
            ]);

            $rules = [
                'basic_salary' => 'sometimes|required|numeric|min:0',
                'ptkp_code' => 'sometimes|required|string|max:20',
                'npwp' => 'nullable|string|max:30',
                // bank when cash_active=false
                'bank.name' => 'nullable|string|max:255',
                'bank.account_number' => 'nullable|string|max:100',
                'bank.account_name' => 'nullable|string|max:255',
                'bank.bank_code' => 'nullable|string|max:50',
                'bank.bank_branch' => 'nullable|string|max:100',
                // BPJS
                'bpjs_kesehatan_number' => 'nullable|string|max:100',
                'bpjs_kesehatan_contribution' => 'nullable|string|max:50',
                'bpjs_ketenagakerjaan_number' => 'nullable|string|max:100',
                'bpjs_ketenagakerjaan_contribution' => 'nullable|string|max:50',
            ];

            $validated = $request->validate($rules);

            \DB::beginTransaction();
            try {
                // Update only fillable fields on Employee
                $employee->fill([
                    'basic_salary' => $validated['basic_salary'] ?? $employee->basic_salary,
                ]);
                $employee->save();

                // Bank account: simplistic approach — update first or create
                if ($request->has('cash_active') && $request->boolean('cash_active')) {
                    // If paid cash, optionally clear bank accounts
                } else if ($request->has('bank')) {
                    $bank = $employee->bankAccounts()->first();
                    if ($bank) {
                        $bank->update([
                            'name' => data_get($validated, 'bank.name'),
                            'account_number' => data_get($validated, 'bank.account_number'),
                            'account_name' => data_get($validated, 'bank.account_name'),
                            'bank_code' => data_get($validated, 'bank.bank_code'),
                            'bank_branch' => data_get($validated, 'bank.bank_branch'),
                        ]);
                    } else {
                        $employee->bankAccounts()->create([
                            'name' => data_get($validated, 'bank.name'),
                            'account_number' => data_get($validated, 'bank.account_number'),
                            'account_name' => data_get($validated, 'bank.account_name'),
                            'bank_code' => data_get($validated, 'bank.bank_code'),
                            'bank_branch' => data_get($validated, 'bank.bank_branch'),
                        ]);
                    }
                }

                // BPJS: upsert by type if provided
                if ($request->hasAny(['bpjs_kesehatan_active', 'bpjs_kesehatan_number'])) {
                    $bpjsKs = $employee->bpjs()->firstOrNew(['bpjs_type' => EmployeeBpjs::BPJS_TYPE_KS]);
                    $bpjsKs->participant_number = $validated['bpjs_kesehatan_number'] ?? $bpjsKs->participant_number;
                    $bpjsKs->save();
                }
                if ($request->hasAny(['bpjs_ketenagakerjaan_active', 'bpjs_ketenagakerjaan_number'])) {
                    $bpjsTk = $employee->bpjs()->firstOrNew(['bpjs_type' => EmployeeBpjs::BPJS_TYPE_TK]);
                    $bpjsTk->participant_number = $validated['bpjs_ketenagakerjaan_number'] ?? $bpjsTk->participant_number;
                    $bpjsTk->save();
                }

                // Tax status
                if ($request->hasAny(['ptkp_code', 'npwp', 'is_spouse_working'])) {
                    $tax = $employee->taxStatus; // hasOne
                    if (!$tax) {
                        $tax = $employee->taxStatus()->make();
                    }
                    $tax->ptkp_code = $validated['ptkp_code'] ?? $tax->ptkp_code;
                    $tax->npwp = $validated['npwp'] ?? $tax->npwp;
                    $tax->is_spouse_working = $request->boolean('is_spouse_working', (bool) $tax->is_spouse_working);
                    $employee->taxStatus()->save($tax);
                }

                \DB::commit();
                $employee->load([
                    'position',
                    'positionLevel',
                    'department',
                    'employmentStatus',
                    'employeeType',
                    'emergencyContacts',
                    'bankAccounts',
                    'bpjs',
                    'taxStatus',
                    'bodyProfile'
                ]);
                return $this->respondSuccess($employee, false, 'Payroll data updated successfully');
            } catch (\Exception $e) {
                \DB::rollBack();
                throw $e;
            }
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('updatePayroll error: ' . $e->getMessage(), ['exception' => $e]);
            return $this->respondError500('Failed to update payroll data');
        }
    }

    /**
     * Update employee section (unified endpoint for different sections)
     */
    public function updateSection(Request $request, Employee $employee, $section)
    {
        try {
            switch ($section) {
                case 'personal':
                    return $this->updatePersonalSection($request, $employee);
                case 'emergency_contact':
                    return $this->updateEmergencySection($request, $employee);
                case 'employment_data':
                    return $this->updateEmploymentSection($request, $employee);
                case 'body_profile':
                    return $this->updateBodySection($request, $employee);
                case 'bpjs_information':
                    return $this->updateBpjsSection($request, $employee);
                case 'tax_information':
                    return $this->updateTaxSection($request, $employee);
                case 'bank_information':
                    return $this->updateBankSection($request, $employee);
                default:
                    return $this->respondError('Invalid section specified', 400);
            }
        } catch (\Exception $e) {
            Log::error('updateSection error: ' . $e->getMessage(), ['section' => $section, 'exception' => $e]);
            return $this->respondError500('Failed to update section');
        }
    }

    private function updatePersonalSection(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email,' . $employee->id,
            'phone' => 'required|string|max:30',
            'identity_number' => 'nullable|string|max:20',
            'kk_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'postal_code' => 'nullable|string|max:10',
            'birth_date' => 'nullable|date',
            'place_of_birth' => 'nullable|string|max:100',
            'religion' => 'nullable|string|in:Islam,Katolik,Kristen,Buddha,Hindu,Confucius,Others',
            'marital_status' => 'nullable|in:SINGLE,MARRIED,DIVORCED,WIDOWED',
            'spouse_name' => 'nullable|string|max:255',
            'spouse_phone' => 'nullable|string|max:30',
            'mothermaiden_name' => 'nullable|string|max:255',
            'last_education' => 'nullable|string|max:100',
            'gender' => 'nullable|in:MALE,FEMALE',
        ]);

        $employee->fill($validated);
        $employee->save();

        $employee->load(['position', 'positionLevel', 'employeeType', 'outsourcingField', 'emergencyContacts', 'bankAccounts', 'bpjs', 'taxStatus']);
        return $this->respondSuccess($employee, false, 'Personal data updated successfully');
    }

    private function updateEmergencySection(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'relationship' => 'required|string|max:100',
            'phone' => 'required|string|max:30',
        ]);

        // Update or create emergency contact
        $emergencyContact = $employee->emergencyContacts()->first();
        if ($emergencyContact) {
            $emergencyContact->update($validated);
        } else {
            $employee->emergencyContacts()->create($validated);
        }

        $employee->load(['position', 'positionLevel', 'employeeType', 'outsourcingField', 'emergencyContacts', 'bankAccounts', 'bpjs', 'taxStatus']);
        return $this->respondSuccess($employee, false, 'Emergency contact updated successfully');
    }

    private function updateBodySection(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'height' => 'nullable|string|max:20',
            'weight' => 'nullable|string|max:20',
            'blood_type' => 'nullable|string|in:A,B,AB,O,A+,A-,B+,B-,AB+,AB-,O+,O-,UNKNOWN',
            'shirt_size' => 'nullable|string|in:S,M,L,XL,XXL,XXXL,CUSTOM,UNKNOWN',
            'shoe_size' => 'nullable|string|max:20',
            'health_notes' => 'nullable|string',
        ]);

        // Update or create body profile
        if ($employee->bodyProfile) {
            $employee->bodyProfile->fill($validated);
            $employee->bodyProfile->save();
        } else {
            $employee->bodyProfile()->create($validated);
        }

        $employee->load(['position', 'positionLevel', 'employeeType', 'outsourcingField', 'emergencyContacts', 'bankAccounts', 'bpjs', 'taxStatus', 'bodyProfile']);
        return $this->respondSuccess($employee, false, 'Body profile updated successfully');
    }

    private function updateBpjsSection(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'bpjs_kesehatan_active' => 'required|string|in:true,false',
            'bpjs_kesehatan_number' => 'nullable|string|max:50',
            'bpjs_kesehatan_contribution' => 'nullable|string|in:BY-COMPANY,BY-EMPLOYEE,DEFAULT',
            'bpjs_ketenagakerjaan_active' => 'required|string|in:true,false',
            'bpjs_ketenagakerjaan_number' => 'nullable|string|max:50',
            'bpjs_ketenagakerjaan_contribution' => 'nullable|string|in:BY-COMPANY,BY-EMPLOYEE,DEFAULT',
        ]);

        \DB::beginTransaction();
        try {
            // Handle BPJS Kesehatan
            $bpjsKsActive = $validated['bpjs_kesehatan_active'] === 'true';
            $existingBpjsKs = $employee->bpjs()->where('bpjs_type', EmployeeBpjs::BPJS_TYPE_KS)->first();

            if ($bpjsKsActive) {
                $bpjsKsData = [
                    'bpjs_type' => EmployeeBpjs::BPJS_TYPE_KS,
                    'participant_number' => $validated['bpjs_kesehatan_number'] ?? null,
                    'contribution_type' => $validated['bpjs_kesehatan_contribution'] ?? 'BY-COMPANY',
                ];

                if ($existingBpjsKs) {
                    $existingBpjsKs->update($bpjsKsData);
                } else {
                    $employee->bpjs()->create($bpjsKsData);
                }
            } else {
                // If not active, delete existing BPJS KS record
                if ($existingBpjsKs) {
                    $existingBpjsKs->delete();
                }
            }

            // Handle BPJS Ketenagakerjaan
            $bpjsTkActive = $validated['bpjs_ketenagakerjaan_active'] === 'true';
            $existingBpjsTk = $employee->bpjs()->where('bpjs_type', EmployeeBpjs::BPJS_TYPE_TK)->first();

            if ($bpjsTkActive) {
                $bpjsTkData = [
                    'bpjs_type' => EmployeeBpjs::BPJS_TYPE_TK,
                    'participant_number' => $validated['bpjs_ketenagakerjaan_number'] ?? null,
                    'contribution_type' => $validated['bpjs_ketenagakerjaan_contribution'] ?? 'BY-COMPANY',
                ];

                if ($existingBpjsTk) {
                    $existingBpjsTk->update($bpjsTkData);
                } else {
                    $employee->bpjs()->create($bpjsTkData);
                }
            } else {
                // If not active, delete existing BPJS TK record
                if ($existingBpjsTk) {
                    $existingBpjsTk->delete();
                }
            }

            \DB::commit();

            $employee->load(['position', 'positionLevel', 'employeeType', 'outsourcingField', 'emergencyContacts', 'bankAccounts', 'bpjs', 'taxStatus']);
            return $this->respondSuccess($employee, false, 'BPJS information updated successfully');

        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('updateBpjsSection error: ' . $e->getMessage(), ['exception' => $e]);
            throw $e;
        }
    }

    private function updateTaxSection(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'ptkp_code' => 'required|string|max:20',
            'is_spouse_working' => 'required|string|in:true,false',
            'npwp' => 'nullable|string|max:30',
        ]);

        // Convert string boolean to actual boolean
        $isSpouseWorking = $validated['is_spouse_working'] === 'true';

        // Update or create tax status
        if ($employee->taxStatus) {
            $employee->taxStatus->update([
                'ptkp_code' => $validated['ptkp_code'],
                'is_spouse_working' => $isSpouseWorking,
                'npwp' => $validated['npwp'],
            ]);
        } else {
            $employee->taxStatus()->create([
                'ptkp_code' => $validated['ptkp_code'],
                'is_spouse_working' => $isSpouseWorking,
                'npwp' => $validated['npwp'],
            ]);
        }

        $employee->load(['position', 'positionLevel', 'employeeType', 'outsourcingField', 'emergencyContacts', 'bankAccounts', 'bpjs', 'taxStatus']);
        return $this->respondSuccess($employee, false, 'Tax information updated successfully');
    }

    private function updateBankSection(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'cash_active' => 'required|string|in:true,false',
            'name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'account_name' => 'nullable|string|max:255',
            'bank_code' => 'nullable|string|max:20',
            'bank_branch' => 'nullable|string|max:255',
        ]);

        // Convert string boolean to actual boolean
        $isCashActive = $validated['cash_active'] === 'true';

        if ($isCashActive) {
            // If cash payment is active, delete any existing bank accounts
            $employee->bankAccounts()->delete();
        } else {
            // If bank transfer is selected, require bank details
            $bankValidated = $request->validate([
                'name' => 'required|string|max:255',
                'account_number' => 'required|string|max:50',
                'account_name' => 'required|string|max:255',
                'bank_code' => 'nullable|string|max:20',
                'bank_branch' => 'nullable|string|max:255',
            ]);

            // Update or create bank account
            $bankAccount = $employee->bankAccounts()->first();
            if ($bankAccount) {
                $bankAccount->update($bankValidated);
            } else {
                $employee->bankAccounts()->create($bankValidated);
            }
        }

        $employee->load(['position', 'positionLevel', 'employeeType', 'outsourcingField', 'emergencyContacts', 'bankAccounts', 'bpjs', 'taxStatus']);
        return $this->respondSuccess($employee, false, 'Bank information updated successfully');
    }

    private function updateEmploymentSection(Request $request, Employee $employee)
    {
        try {
            // Get the employee type to determine validation rules
            $employeeTypeId = $request->input('employee_type_id');
            $employeeType = null;

            if ($employeeTypeId) {
                $employeeType = \App\Models\EmployeeType::find($employeeTypeId);
            }

            // Determine if this is an outsourcing employee type
            $isOutsourcing = false;
            if ($employeeType) {
                $isOutsourcing = stripos($employeeType->name, 'outsourcing') !== false ||
                    stripos($employeeType->name, 'kontrak') !== false ||
                    stripos($employeeType->name, 'external') !== false;
            }

            // Base validation rules
            $validationRules = [
                'employee_code' => 'nullable|string|max:50',
                'join_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:join_date',
                'approval_line' => 'nullable|string|max:255',
                'basic_salary' => 'nullable|numeric|min:0',
                'employee_type_id' => 'nullable|exists:employee_types,id',
                'employment_status_id' => 'nullable|exists:employment_statuses,id',
                'level_id' => 'nullable|exists:position_levels,id',
            ];

            // Conditional validation based on employee type
            if ($isOutsourcing) {
                // For outsourcing employees
                $validationRules['outsourcing_field_id'] = 'nullable|exists:outsourcing_fields,id';
                $validationRules['position_id'] = 'nullable'; // Allow but ignore
                $validationRules['department_id'] = 'nullable'; // Allow but ignore
            } else {
                // For internal employees
                $validationRules['position_id'] = 'nullable|exists:positions,id';
                $validationRules['department_id'] = 'nullable|exists:departments,id';
                $validationRules['outsourcing_field_id'] = 'nullable'; // Allow but ignore
            }

            $validated = $request->validate($validationRules);

            // Clean the data based on employee type
            if ($isOutsourcing) {
                // For outsourcing: clear internal fields
                $validated['position_id'] = null;
                $validated['department_id'] = null;
            } else {
                // For internal: clear outsourcing fields
                $validated['outsourcing_field_id'] = null;
            }

            // Handle null values properly - don't update if null
            $updateData = [];
            foreach ($validated as $key => $value) {
                if ($value !== null) {
                    $updateData[$key] = $value;
                }
            }

            // Special handling for basic_salary - convert null to default 0
            if (array_key_exists('basic_salary', $validated)) {
                if ($validated['basic_salary'] === null || $validated['basic_salary'] === '') {
                    $updateData['basic_salary'] = 0; // Set to default value
                } else {
                    $updateData['basic_salary'] = floatval($validated['basic_salary']);
                }
            }

            // Update employee fields only with processed values
            if (!empty($updateData)) {
                $employee->fill($updateData);
                $employee->save();
            }

            $employee->load([
                'position',
                'positionLevel',
                'department',
                'employmentStatus',
                'employeeType',
                'outsourcingField',
                'emergencyContacts',
                'bankAccounts',
                'bpjs',
                'taxStatus'
            ]);

            return $this->respondSuccess($employee, false, 'Employment data updated successfully');

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('updateEmploymentSection error: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all(),
                'employee_id' => $employee->id,
                'validated_data' => $validated ?? [],
                'update_data' => $updateData ?? []
            ]);
            return $this->respondError500('Failed to update employment data');
        }
    }

    /**
     * Download bulk employee template
     *
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
     */
    public function downloadTemplate()
    {
        try {
            $filename = 'bulk_employee_template_' . date('Y-m-d_H-i-s') . '.xlsx';

            return Excel::download(new BulkEmployeeTemplateExport, $filename);

        } catch (\Exception $e) {
            Log::error('Download template error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to download template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk import employees from Excel file
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkImport(Request $request)
    {
        try {
            // Validate the uploaded file
            $request->validate([
                'file' => 'required|file|mimes:xlsx,xls|max:10240', // Max 10MB
            ]);

            $file = $request->file('file');

            // Create import instance
            $import = new BulkEmployeeImport();

            // Process the import
            Excel::import($import, $file);

            // Get results
            $results = $import->getResults();

            // Prepare response
            $response = [
                'success' => true,
                'message' => "Bulk import completed. {$results['success_count']} employees created successfully.",
                'data' => [
                    'success_count' => $results['success_count'],
                    'error_count' => $results['error_count'],
                    'total_processed' => $results['success_count'] + $results['error_count'],
                    'processed_data' => $results['processed_data'],
                ]
            ];

            // Add errors to response if any
            if ($results['error_count'] > 0) {
                $response['data']['errors'] = $results['errors'];
                $response['message'] = "Bulk import completed with {$results['error_count']} errors. {$results['success_count']} employees created successfully.";
            }

            // Return appropriate status based on results
            if ($results['error_count'] > 0 && $results['success_count'] === 0) {
                // All failed
                $response['success'] = false;
                $response['message'] = "Bulk import failed. No employees were created due to validation errors.";
                return response()->json($response, 422);
            } elseif ($results['error_count'] > 0) {
                // Partial success
                return response()->json($response, 207); // Multi-Status
            } else {
                // All success
                return response()->json($response, 201);
            }

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'File validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Bulk import error: ' . $e->getMessage(), ['exception' => $e]);
            return $this->respondError500('Failed to process bulk import');
        }
    }

    /**
     * Export employees to Excel with filters
     */
    public function export(Request $request)
    {
        $filters = $request->only([
            'search',
            'department_id',
            'position_id',
            'employment_status_id',
            'status',
            'gender',
            'join_date_from',
            'join_date_to'
        ]);

        // Clean empty filters
        $filters = array_filter($filters, function($value) {
            return !is_null($value) && $value !== '';
        });

        $filename = 'data-karyawan-' . now()->format('Y-m-d-H-i-s') . '.xlsx';

        return Excel::download(new EmployeesExport($filters), $filename);
    }

    /**
     * Get master data for bulk import reference
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMasterDataForBulk()
    {
        try {
            $masterData = [
                'positions' => \App\Models\Position::select('id', 'name')->orderBy('name')->get(),
                'position_levels' => \App\Models\PositionLevel::select('id', 'name')->orderBy('name')->get(),
                'departments' => \App\Models\Department::select('id', 'name')->orderBy('name')->get(),
                'employment_statuses' => \App\Models\EmploymentStatus::select('id', 'name')->orderBy('name')->get(),
                'employee_types' => \App\Models\EmployeeType::select('id', 'name')->orderBy('name')->get(),
                'outsourcing_fields' => \App\Models\OutsourcingField::select('id', 'name')->orderBy('name')->get(),
            ];

            return $this->respondSuccess($masterData, false, 'Master data retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Get master data error: ' . $e->getMessage(), ['exception' => $e]);
            return $this->respondError500('Failed to retrieve master data');
        }
    }

    public function quickSearch(Request $request)
    {
        $q = trim($request->get('q', ''));
        if ($q === '') {
            return response()->json(['data' => []]);
        }

        $items = Employee::query()
            ->select('id', 'employee_code', 'full_name')
            ->where(function ($w) use ($q) {
                $w->where('full_name', 'like', "%{$q}%")
                    ->orWhere('employee_code', 'like', "%{$q}%");
            })
            ->orderByRaw("CASE WHEN employee_code = ? THEN 0 ELSE 1 END", [$q])
            ->orderBy('full_name')
            ->limit(15)
            ->get();

        return response()->json(['data' => $items]);
    }

    /**
     * Get employees that don't have user accounts
     */
    public function getEmployeesWithoutUsers(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        $search = $request->get('search');

        $query = Employee::with(['department', 'position'])
            ->whereDoesntHave('user')
            ->where('status', 'active');

        // Apply search filters
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $employees = $query->orderBy('full_name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'employees' => $employees->items(),
            'meta' => [
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'per_page' => $employees->perPage(),
                'total' => $employees->total(),
            ]
        ]);
    }
}
