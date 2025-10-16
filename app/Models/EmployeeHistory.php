<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\HasApprovable;
use App\CreatesApprovalFlow;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class EmployeeHistory extends Model
{
    use HasFactory, HasApprovable, CreatesApprovalFlow;

    protected $fillable = [
        'employee_id',
        'type', // transfer|mutation|rotation
        'from_position_id','to_position_id',
        'from_level_id','to_level_id',
        'from_department_id','to_department_id',
        'from_shift_id','to_shift_id',
        'from_employment_status_id','to_employment_status_id',
        'change_reason',
        'effective_date',
        'snapshot_before','snapshot_after',
        'initiated_by','approval_line','applied_at','cancelled_at'
    ];

    protected $casts = [
    'effective_date' => 'date',
        'snapshot_before' => 'array',
        'snapshot_after' => 'array',
        'applied_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public const TYPE_TRANSFER = 'transfer';
    public const TYPE_MUTATION = 'mutation';
    public const TYPE_ROTATION = 'rotation';


    public function initiator()
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function fromPosition()
    {
        return $this->belongsTo(Position::class, 'from_position_id');
    }

    public function toPosition()
    {
        return $this->belongsTo(Position::class, 'to_position_id');
    }

    public function fromLevel()
    {
        return $this->belongsTo(PositionLevel::class, 'from_level_id');
    }

    public function toLevel()
    {
        return $this->belongsTo(PositionLevel::class, 'to_level_id');
    }

    public function fromDepartment()
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function toDepartment()
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    public function fromShift()
    {
        return $this->belongsTo(Shift::class, 'from_shift_id');
    }

    public function toShift()
    {
        return $this->belongsTo(Shift::class, 'to_shift_id');
    }

    public function fromEmploymentStatus()
    {
        return $this->belongsTo(EmploymentStatus::class, 'from_employment_status_id');
    }

    public function toEmploymentStatus()
    {
        return $this->belongsTo(EmploymentStatus::class, 'to_employment_status_id');
    }

    /**
     * Apply the change to the employee if approved and effective date reached.
     */
    public function applyIfDue(): bool
    {
    // Determine approval status from latest approval (all must be approved)
    if (!$this->approvals()->exists()) return false;
    $pending = $this->approvals()->where('status','pending')->exists();
    if ($pending) return false;
    $rejected = $this->approvals()->where('status','rejected')->exists();
    if ($rejected) return false;
        if ($this->applied_at) return false; // already applied
        if (!$this->effective_date || now()->lt($this->effective_date)) return false;

        return DB::transaction(function () {
            $employee = $this->employee()->lockForUpdate()->first();
            if (!$employee) return false;

            $employee->fill([
                'position_id' => $this->to_position_id,
                'level_id' => $this->to_level_id,
                'department_id' => $this->to_department_id,
                'shift_id' => $this->to_shift_id,
                'employment_status_id' => $this->to_employment_status_id,
            ]);
            $employee->save();

            $this->applied_at = now();
            $this->save();
            return true;
        });
    }

    protected static function booted(): void
    {
        static::creating(function (EmployeeHistory $history) {
            if (!$history->initiated_by && Auth::id()) {
                $history->initiated_by = Auth::id();
            }

            // capture snapshot before
            if ($history->employee_id && empty($history->snapshot_before)) {
                $emp = Employee::find($history->employee_id);
                if ($emp) {
                    $history->snapshot_before = [
                        'position_id' => $emp->position_id,
                        'level_id' => $emp->level_id,
                        'department_id' => $emp->department_id,
                        'shift_id' => $emp->shift_id,
                        'employment_status_id' => $emp->employment_status_id,
                    ];
                }
            }
            // build snapshot_after from provided to_* fields
            $history->snapshot_after = [
                'position_id' => $history->to_position_id,
                'level_id' => $history->to_level_id,
                'department_id' => $history->to_department_id,
                'shift_id' => $history->to_shift_id,
                'employment_status_id' => $history->to_employment_status_id,
            ];
        });

        static::created(function (EmployeeHistory $history) {
            // try create approval flow; if none configured, auto-approve & apply immediately if effective now
            $history->createApprovalFlow($history->approval_line);
            if ($history->approvals()->count() === 0) {
                $history->applyIfDue(); // immediate apply if no approvals configured
            }
        });

        static::updated(function (EmployeeHistory $history) {
            // Whenever approvals change externally, a listener could call applyIfDue(); here we optimistic check.
            $history->applyIfDue();
        });
    }
}
