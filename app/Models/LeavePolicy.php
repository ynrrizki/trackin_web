<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeavePolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'leave_category_id','scope_type','scope_id','priority','effective_start','effective_end','quota_days','prorate_on_join','prorate_on_resign','carryover_max_days','carryover_expiry_months','requires_proof','reason_durations','cuti_bersama_deducts','blackout'
    ];

    protected $casts = [
        'effective_start' => 'date',
        'effective_end' => 'date',
        'quota_days' => 'integer',
        'prorate_on_join' => 'boolean',
        'prorate_on_resign' => 'boolean',
        'carryover_max_days' => 'integer',
        'carryover_expiry_months' => 'integer',
        'requires_proof' => 'boolean',
        'reason_durations' => 'array',
        'cuti_bersama_deducts' => 'boolean',
        'blackout' => 'array',
    ];

    public function category() {
        return $this->belongsTo(LeaveCategory::class, 'leave_category_id');
    }
}
