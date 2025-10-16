<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payslip extends Model
{
    protected $fillable = [
        'employee_id',
        'period_start',
        'period_end',
        'base_salary',
        'allowance',
        'overtime_payment',
        'deduction',
        'net_salary',
        'notes',
        'paid_status',
        'paid_at'
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'paid_at' => 'datetime',
        'base_salary' => 'decimal:2',
        'allowance' => 'decimal:2',
        'overtime_payment' => 'decimal:2',
        'deduction' => 'decimal:2',
        'net_salary' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    // Status badge helper
    public function getStatusBadgeAttribute(): string
    {
        return match ($this->paid_status) {
            'unpaid' => '<span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Unpaid</span>',
            'processing' => '<span class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">Processing</span>',
            'paid' => '<span class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Paid</span>',
            default => '<span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Unknown</span>',
        };
    }

    // Period display helper
    public function getPeriodDisplayAttribute(): string
    {
        $start = $this->period_start ? $this->period_start->format('d M Y') : '';
        $end = $this->period_end ? $this->period_end->format('d M Y') : '';
        return $start . ' - ' . $end;
    }

    // Format currency helper
    public function formatCurrency($amount): string
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }

    // Calculate net salary from components
    public function calculateAndSetNetSalary(): void
    {
        $totalEarnings = (float) $this->base_salary + (float) $this->allowance + (float) $this->overtime_payment;
        $totalDeductions = (float) $this->deduction;

        $this->attributes['net_salary'] = $totalEarnings - $totalDeductions;
    }

    // Get salary from employee salary components
    public static function generateFromEmployeeSalary($employeeId, $periodStart, $periodEnd)
    {
        $employee = Employee::with(['salaries.component'])->findOrFail($employeeId);

        $baseSalary = 0;
        $allowance = 0;
        $deduction = 0;

        foreach ($employee->salaries as $salary) {
            if ($salary->effective_date <= $periodEnd) {
                switch ($salary->component->type) {
                    case 'EARNING':
                        if (str_contains(strtolower($salary->component->name), 'basic')) {
                            $baseSalary = $salary->amount;
                        } else {
                            $allowance += $salary->amount;
                        }
                        break;
                    case 'DEDUCTION':
                    case 'TAX':
                        $deduction += $salary->amount;
                        break;
                }
            }
        }

        return [
            'base_salary' => $baseSalary,
            'allowance' => $allowance,
            'deduction' => $deduction,
            'overtime_payment' => 0,
        ];
    }
}
