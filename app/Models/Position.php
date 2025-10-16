<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    protected $fillable = [
        'name',
        'code',
        'employee_type_id',
        'status',
        'description',
    ];

    /**
     * Get the employee type that owns the position.
     */
    public function employeeType()
    {
        return $this->belongsTo(EmployeeType::class);
    }
}
