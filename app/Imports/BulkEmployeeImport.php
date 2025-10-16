<?php

namespace App\Imports;

use App\Models\Employee;
use App\Models\EmployeeBpjs;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;

class BulkEmployeeImport implements ToCollection, WithHeadingRow, WithValidation, SkipsOnError
{
    use SkipsErrors;

    protected $successCount = 0;
    protected $errorCount = 0;
    protected $errors = [];
    protected $processedData = [];

    /**
     * Process the collection data
     *
     * @param Collection $collection
     */
    public function collection(Collection $collection)
    {
        foreach ($collection as $rowIndex => $row) {
            // Skip empty rows
            if ($this->isRowEmpty($row)) {
                continue;
            }

            try {
                DB::beginTransaction();

                // Process and validate the row
                $employeeData = $this->processRowData($row, $rowIndex + 2); // +2 because of heading row and 0-based index

                // Create the employee record
                $employee = $this->createEmployee($employeeData);

                DB::commit();
                $this->successCount++;
                $this->processedData[] = [
                    'row' => $rowIndex + 2,
                    'employee_id' => $employee->id,
                    'name' => $employee->full_name,
                    'status' => 'success'
                ];

            } catch (\Exception $e) {
                DB::rollBack();
                $this->errorCount++;
                $this->errors[] = [
                    'row' => $rowIndex + 2,
                    'error' => $e->getMessage(),
                    'data' => $row->toArray()
                ];
                Log::error('Bulk import error on row ' . ($rowIndex + 2) . ': ' . $e->getMessage(), [
                    'row_data' => $row->toArray(),
                    'exception' => $e
                ]);
            }
        }
    }

    /**
     * Check if a row is empty
     *
     * @param Collection $row
     * @return bool
     */
    private function isRowEmpty(Collection $row): bool
    {
        $requiredFields = ['full_name', 'email', 'phone'];

        foreach ($requiredFields as $field) {
            if (!empty(trim($row->get($field, '')))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Process and validate row data
     *
     * @param Collection $row
     * @param int $rowNumber
     * @return array
     */
    private function processRowData(Collection $row, int $rowNumber): array
    {
        // Convert collection to array for easier handling
        $data = $row->toArray();

        // Clean and validate data
        $processedData = [
            // Personal Data
            'full_name' => trim($data['full_name'] ?? ''),
            'email' => trim(strtolower($data['email'] ?? '')),
            'phone' => $this->normalizePhone($data['phone'] ?? ''),
            'identity_number' => trim($data['identity_number'] ?? '') ?: null,
            'kk_number' => trim($data['kk_number'] ?? '') ?: null,
            'address' => trim($data['address'] ?? ''),
            'postal_code' => trim($data['postal_code'] ?? '') ?: null,
            'birth_date' => $this->parseDate($data['birth_date'] ?? ''),
            'place_of_birth' => trim($data['place_of_birth'] ?? '') ?: null,
            'religion' => trim($data['religion'] ?? '') ?: null,
            'gender' => strtoupper(trim($data['gender'] ?? '')),
            'marital_status' => strtoupper(trim($data['marital_status'] ?? '')) ?: 'SINGLE',
            'spouse_name' => trim($data['spouse_name'] ?? '') ?: null,
            'spouse_phone' => $this->normalizePhone($data['spouse_phone'] ?? ''),
            'last_education' => trim($data['last_education'] ?? '') ?: null,
            'mothermaiden_name' => trim($data['mothermaiden_name'] ?? '') ?: null,

            // Body Profile
            'height' => trim($data['height'] ?? '') ?: null,
            'weight' => trim($data['weight'] ?? '') ?: null,
            'blood_type' => strtoupper(trim($data['blood_type'] ?? '')) ?: null,
            'shirt_size' => strtoupper(trim($data['shirt_size'] ?? '')) ?: null,
            'shoe_size' => trim($data['shoe_size'] ?? '') ?: null,
            'health_notes' => trim($data['health_notes'] ?? '') ?: null,

            // Emergency Contact
            'emergency_contact_name' => trim($data['emergency_contact_name'] ?? ''),
            'emergency_contact_relationship' => trim($data['emergency_contact_relationship'] ?? ''),
            'emergency_contact_phone' => $this->normalizePhone($data['emergency_contact_phone'] ?? ''),

            // Employment Data
            'employee_code' => trim($data['employee_code'] ?? '') ?: null,
            'join_date' => $this->parseDate($data['join_date'] ?? ''),
            'end_date' => $this->parseDate($data['end_date'] ?? '') ?: null,
            'position_id' => $this->parseInteger($data['position_id'] ?? ''),
            'level_id' => $this->parseInteger($data['level_id'] ?? ''),
            'department_id' => $this->parseInteger($data['department_id'] ?? '') ?: null,
            'employment_status_id' => $this->parseInteger($data['employment_status_id'] ?? ''),
            'employee_type_id' => $this->parseInteger($data['employee_type_id'] ?? ''),
            'outsourcing_field_id' => $this->parseInteger($data['outsourcing_field_id'] ?? '') ?: null,
            'approval_line' => trim($data['approval_line'] ?? '') ?: null,

            // Payroll Data
            'basic_salary' => $this->parseNumeric($data['basic_salary'] ?? '0'),
            'cash_active' => $this->parseBoolean($data['cash_active'] ?? 'false'),

            // Bank Information
            'bank_name' => trim($data['bank_name'] ?? '') ?: null,
            'bank_account_number' => trim($data['bank_account_number'] ?? '') ?: null,
            'bank_account_name' => trim($data['bank_account_name'] ?? '') ?: null,
            'bank_code' => trim($data['bank_code'] ?? '') ?: null,
            'bank_branch' => trim($data['bank_branch'] ?? '') ?: null,

            // BPJS Information
            'bpjs_kesehatan_active' => $this->parseBoolean($data['bpjs_kesehatan_active'] ?? 'false'),
            'bpjs_kesehatan_number' => trim($data['bpjs_kesehatan_number'] ?? '') ?: null,
            'bpjs_kesehatan_contribution' => trim($data['bpjs_kesehatan_contribution'] ?? 'BY-COMPANY'),
            'bpjs_ketenagakerjaan_active' => $this->parseBoolean($data['bpjs_ketenagakerjaan_active'] ?? 'false'),
            'bpjs_ketenagakerjaan_number' => trim($data['bpjs_ketenagakerjaan_number'] ?? '') ?: null,
            'bpjs_ketenagakerjaan_contribution' => trim($data['bpjs_ketenagakerjaan_contribution'] ?? 'BY-COMPANY'),

            // Tax Information
            'ptkp_code' => trim($data['ptkp_code'] ?? ''),
            'npwp' => trim($data['npwp'] ?? '') ?: null,
            'is_spouse_working' => $this->parseBoolean($data['is_spouse_working'] ?? 'false'),
        ];

        // Validate the processed data
        $this->validateEmployeeData($processedData, $rowNumber);

        return $processedData;
    }

    /**
     * Parse date value
     *
     * @param mixed $value
     * @return string|null
     */
    private function parseDate($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        try {
            // Handle Excel date serial numbers
            if (is_numeric($value)) {
                $date = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value);
                return $date->format('Y-m-d');
            }

            // Handle string dates
            $date = new \DateTime($value);
            return $date->format('Y-m-d');
        } catch (\Exception $e) {
            throw new \Exception("Invalid date format: {$value}");
        }
    }

    /**
     * Parse integer value
     *
     * @param mixed $value
     * @return int|null
     */
    private function parseInteger($value): ?int
    {
        if (empty($value)) {
            return null;
        }

        if (is_numeric($value)) {
            return (int) $value;
        }

        throw new \Exception("Invalid integer value: {$value}");
    }

    /**
     * Parse numeric value
     *
     * @param mixed $value
     * @return float
     */
    private function parseNumeric($value): float
    {
        if (empty($value)) {
            return 0.0;
        }

        // Remove thousands separators and handle different decimal separators
        $value = str_replace([',', ' '], '', $value);

        if (is_numeric($value)) {
            return (float) $value;
        }

        throw new \Exception("Invalid numeric value: {$value}");
    }

    /**
     * Parse boolean value
     *
     * @param mixed $value
     * @return bool
     */
    private function parseBoolean($value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        $value = strtolower(trim($value));
        return in_array($value, ['true', '1', 'yes', 'y', 'on']);
    }

    /**
     * Normalize phone number to string
     *
     * @param mixed $value
     * @return string|null
     */
    private function normalizePhone($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        // Convert to string and remove any scientific notation
        if (is_numeric($value)) {
            // Handle large numbers that might be in scientific notation
            $value = number_format($value, 0, '', '');
        }

        // Clean the phone number
        $phone = trim((string) $value);

        // Remove any non-digit characters except + and spaces for international format
        $phone = preg_replace('/[^\d\+\s\-\(\)]/', '', $phone);

        return $phone ?: null;
    }

    /**
     * Validate employee data
     *
     * @param array $data
     * @param int $rowNumber
     * @throws \Exception
     */
    private function validateEmployeeData(array $data, int $rowNumber): void
    {
        $rules = [
            'full_name' => 'required|string|min:3|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'required|string|max:30',
            'address' => 'required|string',
            'birth_date' => 'required|date',
            'gender' => 'required|in:MALE,FEMALE',
            'emergency_contact_name' => 'required|string|max:255',
            'emergency_contact_relationship' => 'required|string|max:100',
            'emergency_contact_phone' => 'required|string|max:30',
            'join_date' => 'required|date',
            'position_id' => 'required|exists:positions,id',
            'level_id' => 'required|exists:position_levels,id',
            'employment_status_id' => 'required|exists:employment_statuses,id',
            'employee_type_id' => 'required|exists:employee_types,id',
            'basic_salary' => 'required|numeric|min:0',
            'ptkp_code' => 'required|string|max:20',
        ];

        // Conditional validation for department_id (required for internal employees)
        if (!empty($data['employee_type_id'])) {
            $employeeType = \App\Models\EmployeeType::find($data['employee_type_id']);
            if ($employeeType) {
                $isOutsourcing = stripos($employeeType->name, 'outsourcing') !== false ||
                               stripos($employeeType->name, 'kontrak') !== false ||
                               stripos($employeeType->name, 'external') !== false;

                if (!$isOutsourcing) {
                    $rules['department_id'] = 'required|exists:departments,id';
                } else {
                    $rules['outsourcing_field_id'] = 'nullable|exists:outsourcing_fields,id';
                }
            }
        }

        // Conditional validation for bank fields (required if cash_active is false)
        if (!$data['cash_active']) {
            $rules['bank_name'] = 'required|string|max:255';
            $rules['bank_account_number'] = 'required|string|max:100';
            $rules['bank_account_name'] = 'required|string|max:255';
        }

        $validator = Validator::make($data, $rules);

        if ($validator->fails()) {
            $errors = $validator->errors()->all();
            throw new \Exception("Row {$rowNumber} validation failed: " . implode(', ', $errors));
        }
    }

    /**
     * Create employee record
     *
     * @param array $data
     * @return Employee
     */
    private function createEmployee(array $data): Employee
    {
        // Auto generate employee_code if not provided
        if (empty($data['employee_code'])) {
            $nextNumber = Employee::count() + 1;
            $data['employee_code'] = 'EMP' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
        }

        // Create main employee record
        $employee = Employee::create([
            'employee_code' => $data['employee_code'],
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'identity_number' => $data['identity_number'],
            'kk_number' => $data['kk_number'],
            'address' => $data['address'],
            'postal_code' => $data['postal_code'],
            'birth_date' => $data['birth_date'],
            'religion' => $data['religion'],
            'mothermaiden_name' => $data['mothermaiden_name'],
            'marital_status' => $data['marital_status'],
            'gender' => $data['gender'],
            'spouse_name' => $data['spouse_name'],
            'spouse_phone' => $data['spouse_phone'],
            'place_of_birth' => $data['place_of_birth'],
            'last_education' => $data['last_education'],
            'join_date' => $data['join_date'],
            'end_date' => $data['end_date'],
            'position_id' => $data['position_id'],
            'level_id' => $data['level_id'],
            'department_id' => $data['department_id'],
            'employment_status_id' => $data['employment_status_id'],
            'employee_type_id' => $data['employee_type_id'],
            'outsourcing_field_id' => $data['outsourcing_field_id'],
            'approval_line' => $data['approval_line'],
            'status' => Employee::STATUS_ACTIVE,
            'basic_salary' => $data['basic_salary'],
            'npwp' => $data['npwp'],
            'is_spouse_working' => $data['is_spouse_working'],
        ]);

        // Create emergency contact
        $employee->emergencyContacts()->create([
            'name' => $data['emergency_contact_name'],
            'relationship' => $data['emergency_contact_relationship'],
            'phone' => $data['emergency_contact_phone'],
        ]);

        // Create body profile if any body profile data exists
        if ($this->hasBodyProfileData($data)) {
            $employee->bodyProfile()->create([
                'height' => $data['height'],
                'weight' => $data['weight'],
                'blood_type' => $data['blood_type'],
                'shirt_size' => $data['shirt_size'],
                'shoe_size' => $data['shoe_size'],
                'health_notes' => $data['health_notes'],
            ]);
        }

        // Create bank account if not cash active
        if (!$data['cash_active'] && !empty($data['bank_name'])) {
            $employee->bankAccounts()->create([
                'name' => $data['bank_name'],
                'account_number' => $data['bank_account_number'],
                'account_name' => $data['bank_account_name'],
                'bank_code' => $data['bank_code'],
                'bank_branch' => $data['bank_branch'],
            ]);
        }

        // Create BPJS records
        if ($data['bpjs_kesehatan_active']) {
            $employee->bpjs()->create([
                'bpjs_type' => EmployeeBpjs::BPJS_TYPE_KS,
                'participant_number' => $data['bpjs_kesehatan_number'],
                'contribution_type' => $data['bpjs_kesehatan_contribution'],
            ]);
        }

        if ($data['bpjs_ketenagakerjaan_active']) {
            $employee->bpjs()->create([
                'bpjs_type' => EmployeeBpjs::BPJS_TYPE_TK,
                'participant_number' => $data['bpjs_ketenagakerjaan_number'],
                'contribution_type' => $data['bpjs_ketenagakerjaan_contribution'],
            ]);
        }

        // Create tax status
        $employee->taxStatus()->create([
            'ptkp_code' => $data['ptkp_code'],
            'npwp' => $data['npwp'],
            'is_spouse_working' => $data['is_spouse_working'],
        ]);

        return $employee;
    }

    /**
     * Check if row has body profile data
     *
     * @param array $data
     * @return bool
     */
    private function hasBodyProfileData(array $data): bool
    {
        $bodyFields = ['height', 'weight', 'blood_type', 'shirt_size', 'shoe_size', 'health_notes'];

        foreach ($bodyFields as $field) {
            if (!empty($data[$field])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Define validation rules for the import
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            // Basic validation rules that apply to all rows
            '*.full_name' => 'required|string',
            '*.email' => 'required|email',
            '*.phone' => 'required', // Allow both string and numeric phone numbers
        ];
    }

    /**
     * Get import results
     *
     * @return array
     */
    public function getResults(): array
    {
        return [
            'success_count' => $this->successCount,
            'error_count' => $this->errorCount,
            'errors' => $this->errors,
            'processed_data' => $this->processedData,
        ];
    }

    /**
     * Get success count
     *
     * @return int
     */
    public function getSuccessCount(): int
    {
        return $this->successCount;
    }

    /**
     * Get error count
     *
     * @return int
     */
    public function getErrorCount(): int
    {
        return $this->errorCount;
    }

    /**
     * Get all errors
     *
     * @return array
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
