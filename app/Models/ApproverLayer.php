<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApproverLayer extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'approvable_type_id',
        'approver_id',
        'approver_type',
        'status',
        'description',
        'level',
    ];

    /**
     * Get the approvable type that owns this layer.
     */
    public function approvableType()
    {
        return $this->belongsTo(ApprovableType::class);
    }

    /**
     * Get the approver model.
     */
    public function approver()
    {
        return $this->morphTo();
    }

    /**
     * Get approver data safely without relying on traits
     */
    public function getApproverDataAttribute()
    {
        try {
            if ($this->approver_type === 'approval_line') {
                return [
                    'name' => 'Approval Line',
                    'email' => null,
                    'department' => null,
                ];
            }
            if ($this->approver_type === 'App\\Models\\User') {
                $user = \App\Models\User::find($this->approver_id);
                return [
                    'name' => $user->name ?? 'Unknown User',
                    'email' => $user->email ?? null,
                    'department' => $user->department ?? null,
                ];
            } elseif ($this->approver_type === 'App\\Models\\Employee') {
                $employee = \App\Models\Employee::with('department')->find($this->approver_id);
                return [
                    'name' => $employee->full_name ?? 'Unknown Employee',
                    'email' => $employee->email ?? null,
                    'department' => $employee->department->name ?? null,
                    'employee_id' => $employee->employee_id ?? null,
                ];
            } elseif ($this->approver_type === 'App\\Models\\Role') {
                $role = \Spatie\Permission\Models\Role::find($this->approver_id);
                return [
                    'name' => $role->name ?? 'Unknown Role',
                    'email' => null,
                    'department' => null,
                ];
            } elseif ($this->approver_type === 'Spatie\\Permission\\Models\\Role') {
                $role = \Spatie\Permission\Models\Role::find($this->approver_id);
                return [
                    'name' => $role->name ?? 'Unknown Role',
                    'email' => null,
                    'department' => null,
                ];
            }
        } catch (\Exception $e) {
            \Log::warning("Failed to load approver data: " . $e->getMessage());
        }

        return [
            'name' => 'Unknown Approver',
            'email' => null,
            'department' => null,
        ];
    }
}
