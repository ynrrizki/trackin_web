<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeBpjs extends Model
{
    protected $fillable = [
        'employee_id',
        'bpjs_type',
        'participant_number',
        'contribution_type',
    ];

    const BPJS_TYPES = [
        self::BPJS_TYPE_KS,
        self::BPJS_TYPE_TK,
    ];

    const BPJS_TYPE_KS = 'KS'; // Kesehatan
    const BPJS_TYPE_TK = 'TK'; // Ketenagakerjaan

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
