<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeBpjs;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class EmployeeService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function createAction(array $data)
    {
        DB::transaction(function () use ($data) {
            // Pisahkan nested
            $ec = Arr::pull($data, 'emergency_contact', []);
            $bank = Arr::pull($data, 'bank', []);
            $ptkp = Arr::pull($data, 'ptkp_code');  // untuk tax status
            $npwp = Arr::pull($data, 'npwp', null);
            $isSW = Arr::pull($data, 'is_spouse_working', false);

            $bpjsKsOn = Arr::pull($data, 'bpjs_kesehatan_active', false);
            $bpjsTkOn = Arr::pull($data, 'bpjs_ketenagakerjaan_active', false);
            $bpjsKsNum = Arr::pull($data, 'bpjs_kesehatan_number', null);
            $bpjsTkNum = Arr::pull($data, 'bpjs_ketenagakerjaan_number', null);

            $cashActive = Arr::pull($data, 'cash_active', false);

            // Create employee utama
            $employee = Employee::create(array_merge($data, [
                'status' => Employee::STATUS_ACTIVE,
                // employee_code akan difinalkan setelah dapat ID
                'employee_code' => 'TEMP',
            ]));

            // employee_code final berbasis ID (hindari race condition)
            $employee->update([
                'employee_code' => str_pad($employee->id, 5, '0', STR_PAD_LEFT),
            ]);

            // Emergency contact (wajib)
            $employee->emergencyContacts()->create([
                'name' => $ec['name'],
                'relationship' => $ec['relationship'],
                'phone' => $ec['phone'],
            ]);

            // Bank (hanya jika non-cash)
            if (!$cashActive && !empty($bank)) {
                $employee->bankAccounts()->create([
                    'name' => $bank['name'],
                    'account_number' => $bank['account_number'],
                    'account_name' => $bank['account_name'],
                    'bank_code' => $bank['bank_code'] ?? null,
                    'bank_branch' => $bank['bank_branch'] ?? null,
                ]);
            }

            // BPJS
            if ($bpjsKsOn) {
                $employee->bpjs()->create([
                    'bpjs_type' => EmployeeBpjs::BPJS_TYPE_KS,
                    'participant_number' => $bpjsKsNum,
                ]);
            }
            if ($bpjsTkOn) {
                $employee->bpjs()->create([
                    'bpjs_type' => EmployeeBpjs::BPJS_TYPE_TK,
                    'participant_number' => $bpjsTkNum,
                ]);
            }

            // Tax Status
            $employee->taxStatus()->create([
                'ptkp_code' => $ptkp,
                'npwp' => $npwp,
                'is_spouse_working' => (bool) $isSW,
            ]);
        });
    }
}
