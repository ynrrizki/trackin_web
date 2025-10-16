<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeBankAccount extends Model
{
    protected $fillable = [
        'employee_id',
        'name',
        'account_number',
        'account_name',
        'bank_code',
        'bank_branch',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
