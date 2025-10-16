<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'time_in',
        'time_out',
        'latlot_in',
        'latlot_out',
        'is_fake_map_detected',
    ];

    protected $casts = [
        // 'date' => 'date',
        // 'time_in' => 'time',
        // 'time_out' => 'time',
        'is_fake_map_detected' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
