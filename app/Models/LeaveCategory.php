<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'code','name','is_paid','deduct_balance','half_day_allowed','weekend_rule','blackout','base_quota_days','prorate_on_join','prorate_on_resign','carryover_max_days','carryover_expiry_months','requires_proof','defaults'
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'deduct_balance' => 'boolean',
        'half_day_allowed' => 'boolean',
        'blackout' => 'array',
        'prorate_on_join' => 'boolean',
        'prorate_on_resign' => 'boolean',
        'carryover_max_days' => 'integer',
        'carryover_expiry_months' => 'integer',
        'requires_proof' => 'boolean',
        'defaults' => 'array',
    ];
}
