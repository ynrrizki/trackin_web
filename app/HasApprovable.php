<?php

namespace App;

use App\Models\Approval;

trait HasApprovable
{
    public function approvals()
    {
        return $this->morphMany(Approval::class, 'approvable');
    }

    public function approvable()
    {
        return $this->morphTo();
    }

    // More specific accessor name to avoid clashing with generic 'status' fields on models
    public function getApprovalStatusAttribute()
    {
        $status = $this->approvals()->latest()->first()?->status ?? 'pending';
        return is_string($status) ? strtolower($status) : 'pending';
    }

    public function scopePending($query)
    {
        return $query->where(function ($q) {
            $q->whereHas('approvals', function ($subQuery) {
                $subQuery->where('status', 'pending');
            })->orWhereDoesntHave('approvals');
        });
    }

    public function scopeApproved($query)
    {
        return $query->whereHas('approvals', function ($q) {
            $q->where('status', 'approved');
        });
    }

    public function scopeRejected($query)
    {
        return $query->whereHas('approvals', function ($q) {
            $q->where('status', 'rejected');
        });
    }

    public function isApproved()
    {
    return strtolower((string) $this->approval_status) === 'approved';
    }

    public function isRejected()
    {
    return strtolower((string) $this->approval_status) === 'rejected';
    }

    public function isPending()
    {
    return strtolower((string) $this->approval_status) === 'pending';
    }

    // Get status approval
    // public function getStatusBadgeAttribute()
    // {
    //     return match ($this->approvable->status) {
    //         'approved' => '<span class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Disetujui</span>',
    //         'rejected' => '<span class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Ditolak</span>',
    //         default => '<span class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">Menunggu</span>',
    //     };
    // }
}
