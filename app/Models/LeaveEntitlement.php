<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveEntitlement extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id','leave_category_id','period','opening','accrual','consumed','carry_in','carry_out','closing','expires_at'
    ];

    protected $casts = [
        'opening' => 'integer',
        'accrual' => 'integer',
        'consumed' => 'integer',
        'carry_in' => 'integer',
        'carry_out' => 'integer',
        'closing' => 'integer',
        'expires_at' => 'date',
    ];

    public function employee() {
        return $this->belongsTo(Employee::class);
    }

    public function category() {
        return $this->belongsTo(LeaveCategory::class, 'leave_category_id');
    }
}
