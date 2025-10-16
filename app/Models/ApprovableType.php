<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovableType extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'model_class',
        'status',
    ];

    /**
     * Get the approver layers for this approvable type.
     */
    public function approverLayers()
    {
        return $this->hasMany(ApproverLayer::class);
    }

    /**
     * Get active approver layers for this approvable type.
     */
    public function activeApproverLayers()
    {
        return $this->hasMany(ApproverLayer::class)->where('status', 'active');
    }

    /**
     * Get display name for the approvable type
     */
    public function getDisplayNameAttribute()
    {
        $names = [
            'App\\Models\\LeaveRequest' => 'Leave Requests',
            'App\\Models\\Overtime' => 'Overtime Requests',
            'App\\Models\\ClientInvoice' => 'Expense Claims',
            'App\\Models\\Document' => 'Document Approvals',
        ];

        return $names[$this->model_class] ?? $this->name;
    }

    /**
     * Get description for the approvable type
     */
    public function getDescriptionAttribute()
    {
        $descriptions = [
            'App\\Models\\LeaveRequest' => 'Kelola level persetujuan untuk permohonan cuti',
            'App\\Models\\Overtime' => 'Kelola level persetujuan untuk permohonan lembur',
            'App\\Models\\ClientInvoice' => 'Kelola level persetujuan untuk klaim reimburse',
            'App\\Models\\Document' => 'Kelola level persetujuan untuk dokumen',
        ];

        return $descriptions[$this->model_class] ?? 'Kelola level persetujuan';
    }

    /**
     * Get icon for the approvable type
     */
    public function getIconAttribute()
    {
        $icons = [
            'App\\Models\\LeaveRequest' => 'calendar',
            'App\\Models\\Overtime' => 'clock',
            'App\\Models\\ClientInvoice' => 'credit-card',
            'App\\Models\\Document' => 'file-text',
        ];

        return $icons[$this->model_class] ?? 'file-text';
    }
}
