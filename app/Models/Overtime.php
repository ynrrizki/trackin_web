<?php

namespace App\Models;

use App\HasApprovable;
use App\CreatesApprovalFlow;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Overtime extends Model
{
    use HasApprovable, CreatesApprovalFlow;

    protected $fillable = [
        'employee_id',
        'date',
        'start_time',
        'end_time',
        'description',
        // 'status',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    // public function getStatusBadgeAttribute()
    // {
    //     return match ($this->status) {
    //         'approved' => '<span class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Disetujui</span>',
    //         'rejected' => '<span class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Ditolak</span>',
    //         default => '<span class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">Menunggu</span>',
    //     };
    // }

    public function getDurationHoursAttribute()
    {
        if ($this->start_time && $this->end_time) {
            return $this->start_time->diffInHours($this->end_time);
        }
        return 0;
    }
}
