<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmploymentStatus extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description', // Additional description of the employment status
        'status', // active or inactive
    ];

    /**
     * Get the employees for this employment status.
     */
    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}
