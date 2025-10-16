<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeType extends Model
{
    protected $fillable = [
        'code',
        'name',
    ];

    /**
     * Get the employees for this employee type.
     */
    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * Positions under this employee type.
     */
    public function positions()
    {
        return $this->hasMany(Position::class);
    }
}
