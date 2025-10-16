<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeBodyProfile extends Model
{
    protected $fillable = [
        'employee_id',
        'height',
        'weight',
        'blood_type',
        'shirt_size',
        'shoe_size',
        'health_notes',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
