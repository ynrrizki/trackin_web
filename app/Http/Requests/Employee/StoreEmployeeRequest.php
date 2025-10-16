<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Cast & normalisasi input SEBELUM divalidasi.
     * - Ubah string "true"/"false"/"on"/"1" menjadi boolean
     * - Trim string dsb bila perlu
     */
    protected function prepareForValidation(): void
    {
        $toBool = fn($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;

        $this->merge([
            'cash_active' => $toBool($this->input('cash_active')),
            'bpjs_kesehatan_active' => $toBool($this->input('bpjs_kesehatan_active')),
            'bpjs_ketenagakerjaan_active' => $toBool($this->input('bpjs_ketenagakerjaan_active')),
            'is_spouse_working' => $toBool($this->input('is_spouse_working')),
        ]);
    }

    public function rules(): array
    {
        $cashActive = (bool) $this->boolean('cash_active');
        $bpjsKsOn = (bool) $this->boolean('bpjs_kesehatan_active');
        $bpjsTkOn = (bool) $this->boolean('bpjs_ketenagakerjaan_active');

        return [
            // Step 1: Personal Data
            'full_name' => ['required', 'string', 'max:255', 'min:3'],
            'email' => ['required', 'email', 'unique:employees,email'],
            'phone' => ['required', 'string', 'max:30'],
            'identity_number' => ['nullable', 'string', 'max:255'],
            'kk_number' => ['nullable', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'postal_code' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['required', 'date'],
            'religion' => ['nullable', 'string', 'in:Islam,Katolik,Kristen,Buddha,Hindu,Confucius,Others'],
            'marital_status' => ['nullable', 'string', 'in:SINGLE,MARRIED,WIDOW,WIDOWER'],
            'spouse_name' => ['nullable', 'string', 'max:255'],
            'spouse_phone' => ['nullable', 'string', 'max:30'],
            'place_of_birth' => ['nullable', 'string', 'max:255'],
            'last_education' => ['nullable', 'string', 'max:255'],
            'mothermaiden_name' => ['nullable', 'string', 'max:255'],
            'gender' => ['required', 'string', 'in:MALE,FEMALE'],

            // Emergency Contact (required)
            'emergency_contact' => ['required', 'array'],
            'emergency_contact.name' => ['required', 'string', 'max:255'],
            'emergency_contact.relationship' => ['required', 'string', 'max:100'],
            'emergency_contact.phone' => ['required', 'string', 'max:30'],

            // Step 2: Employment Data
            'join_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date'],
            'employee_type_id' => ['required', 'exists:employee_types,id'],
            'position_id' => ['required', 'exists:positions,id'],
            'level_id' => ['required', 'exists:position_levels,id'],

            // Catatan: jangan pakai "nullable|required_if" bareng; pakai salah satu.
            // Di sini department wajib saat employee_type_id == 1
            'department_id' => ['required_if:employee_type_id,1', 'exists:departments,id'],
            'employment_status_id' => ['required', 'exists:employment_statuses,id'],
            'outsourcing_field_id' => ['nullable', 'exists:outsourcing_fields,id'],
            'approval_line' => ['nullable'],

            // Step 3: Payroll & Tax
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'cash_active' => ['sometimes', 'boolean'],
            'is_spouse_working' => ['sometimes', 'boolean'],

            // Bank (conditional by closure agar tidak ribet soal perbandingan string/boolean)
            'bank' => ['nullable', 'array'],
            'bank.name' => [
                Rule::requiredIf(fn() => !$cashActive),
                'string',
                'max:255'
            ],
            'bank.account_number' => [
                Rule::requiredIf(fn() => !$cashActive),
                'string',
                'max:100'
            ],
            'bank.account_name' => [
                Rule::requiredIf(fn() => !$cashActive),
                'string',
                'max:255'
            ],
            'bank.bank_code' => ['nullable', 'string', 'max:50'],
            'bank.bank_branch' => ['nullable', 'string', 'max:100'],

            // BPJS flags + numbers
            'bpjs_kesehatan_active' => ['sometimes', 'boolean'],
            'bpjs_ketenagakerjaan_active' => ['sometimes', 'boolean'],
            'bpjs_kesehatan_number' => [
                Rule::requiredIf(fn() => $bpjsKsOn),
                'nullable',
                'string',
                'max:100'
            ],
            'bpjs_kesehatan_contribution' => ['nullable', 'string', 'max:50'],
            'bpjs_ketenagakerjaan_number' => [
                Rule::requiredIf(fn() => $bpjsTkOn),
                'nullable',
                'string',
                'max:100'
            ],
            'bpjs_ketenagakerjaan_contribution' => ['nullable', 'string', 'max:50'],

            // Tax
            'ptkp_code' => ['required', 'string', 'max:20'],
            'npwp' => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'department_id.required_if' => 'Department wajib diisi untuk employee type tertentu.',
            'bank.name.required' => 'Nama bank wajib diisi bila pembayaran non-tunai.',
            'bank.account_number.required' => 'Nomor rekening wajib diisi bila pembayaran non-tunai.',
            'bank.account_name.required' => 'Nama pemilik rekening wajib diisi bila pembayaran non-tunai.',
            'bpjs_kesehatan_number.required' => 'Nomor BPJS Kesehatan wajib diisi saat status aktif.',
            'bpjs_ketenagakerjaan_number.required' => 'Nomor BPJS Ketenagakerjaan wajib diisi saat status aktif.',
        ];
    }

    /**
     * Ambil payload yang sudah tervalidasi (boleh diperkaya/dibersihkan lagi).
     */
    public function validated($key = null, $default = null)
    {
        $data = parent::validated($key, $default);

        // Pastikan key opsional ada dengan default
        $data['cash_active'] = (bool) ($data['cash_active'] ?? false);
        $data['bpjs_kesehatan_active'] = (bool) ($data['bpjs_kesehatan_active'] ?? false);
        $data['bpjs_ketenagakerjaan_active'] = (bool) ($data['bpjs_ketenagakerjaan_active'] ?? false);
        $data['is_spouse_working'] = (bool) ($data['is_spouse_working'] ?? false);

        return $data;
    }
}
