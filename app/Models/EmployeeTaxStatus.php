<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeTaxStatus extends Model
{
    protected $fillable = [
        'employee_id',
        'ptkp_code', // PKP status (e.g. TK/0, TK/1, TK/2, TK/3, K/1, K/2, K/3)
        'is_spouse_working', // Whether the spouse is working, affects tax calculation
        'npwp', // NPWP number of the employee
    ];

    protected $casts = [
        'is_spouse_working' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
