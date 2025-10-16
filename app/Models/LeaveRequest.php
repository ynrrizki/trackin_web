<?php

namespace App\Models;

use App\HasApprovable;
use App\CreatesApprovalFlow;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveRequest extends Model
{
    use HasApprovable, CreatesApprovalFlow;


    protected $fillable = [
        'employee_id',
        'leave_category_id',
        'start_date',
        'end_date',
        'reason',
        'proof_path',
        // 'status',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(LeaveCategory::class, 'leave_category_id');
    }

    // public function getStatusBadgeAttribute()
    // {
    //     return match ($this->status) {
    //         'approved' => '<span class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Disetujui</span>',
    //         'rejected' => '<span class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Ditolak</span>',
    //         default => '<span class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">Menunggu</span>',
    //     };
    // }

    public function getDurationAttribute()
    {
        return $this->start_date->diffInDays($this->end_date) + 1;
    }
}
