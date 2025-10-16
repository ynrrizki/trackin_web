<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class Approval extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'approver_layer_id',
        'approvable_id',
        'approvable_type',
        'status',
        'approver_id',
        'approver_type',
        'sender_id',
        'sender_type',
    ];

    /**
     *  Get the approver layer model.
     */
    public function layer()
    {
        return $this->belongsTo(ApproverLayer::class);
    }

    /**
     * Get the approvable model.
     */
    public function approvable()
    {
        return $this->morphTo();
    }

    /**
     * Get the approver model.
     */
    public function approver()
    {
        return $this->morphTo();
    }

    /**
     * Get the sender model.
     */
    public function sender()
    {
        return $this->morphTo();
    }

    /**
     * Get the status of the approval.
     *
     * @return string
     */
    public function getStatusAttribute($value)
    {
        return ucfirst($value);
    }

    /**
     * Scope a query to only include pending approvals.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function getLevelAttribute(): ?int
    {
        return optional($this->layer)->level;
    }

    /**
     * When an approval is approved, automatically create the next layer approval if configured.
     */
    protected static function booted(): void
    {
        static::created(function (Approval $approval) {
            $approver = $approval->approver;
            if ($approver && method_exists($approver, 'notify')) {
                $module = strtolower(class_basename($approval->approvable_type)) === 'leaverequest' ? 'leave' : 'overtime';
                $title = 'Permintaan persetujuan baru ' . (optional($approval->sender)->name ?? 'Sistem');
                $approvable = $approval->approvable; // morph
                $rawReason = data_get($approvable, 'reason')
                    ?? data_get($approvable, 'notes')
                    ?? data_get($approvable, 'description');
                $reason = $rawReason ? Str::limit(trim($rawReason), 300) : null;

                // $message = 'Ada permintaan persetujuan ' . $module . ' (tahap ' . $approval->level . ') untuk Anda.';
                $lvl = $approval->level ?? optional($approval->layer)->level ?? 1;
                $message = 'Ada permintaan persetujuan ' . $module . ' (tahap ' . $lvl . ') untuk Anda.'
                    . ($reason ? "\nAlasan: " . $reason : '');
                $approver->notify(new \App\Notifications\ApprovalRequestNotification(
                    $module,
                    $title,
                    $message,
                    approvableType: $approval->approvable_type,
                    approvableId: (int) $approval->approvable_id,
                ));
            }
        });

        static::updated(function (Approval $approval) {
            if (!$approval->wasChanged('status'))
                return;

            $module = strtolower(class_basename($approval->approvable_type)) === 'leaverequest' ? 'leave' : 'overtime';

            if (strtolower($approval->status) === 'approved') {
                // Notify requester
                if ($approval->sender && method_exists($approval->sender, 'notify')) {
                    $title = 'Disetujui oleh ' . optional($approval->approver)->name;
                    $message = 'Permintaan ' . $module . ' Anda disetujui pada tahap ' . $approval->level . '.';
                    $lvl = $approval->level ?? optional($approval->layer)->level ?? 1;
                    $approval->sender->notify(new \App\Notifications\ApprovalStatusNotification(
                        $module,
                        $title,
                        $message,
                        approvableType: $approval->approvable_type,
                        approvableId: (int) $approval->approvable_id,
                        approvalStatus: 'approved',                   // ⬅️ now embedded
                        level: (int) $lvl,                   // ⬅️ now embedded
                        approverId: (int) $approval->approver_id, // opsional
                        approverName: optional($approval->approver)->name,
                    ));
                }
                // Lanjut bila level saat ini selesai
                // $approval->advanceIfCurrentLevelComplete();
                $approval->createNextLayerIfAny();
            }

            if (strtolower($approval->status) === 'rejected') {
                if ($approval->sender && method_exists($approval->sender, 'notify')) {
                    $title = 'Permintaan ditolak';
                    $message = 'Permintaan ' . $module . ' Anda ditolak pada tahap ' . $approval->level . '.';
                    $approval->sender->notify(new \App\Notifications\ApprovalStatusNotification(
                        $module,
                        $title,
                        $message,
                        approvableType: $approval->approvable_type,
                        approvableId: (int) $approval->approvable_id,
                        approvalStatus: 'rejected',
                        level: (int) $lvl,
                        approverId: (int) $approval->approver_id,
                        approverName: optional($approval->approver)->name,
                    ));
                }

                // (Opsional) Auto-cancel semua pending di level saat ini & setelahnya:
                // self::where('approvable_type',$approval->approvable_type)
                //     ->where('approvable_id',$approval->approvable_id)
                //     ->where('status','pending')->update(['status'=>'cancelled']);
            }
        });
    }
    // protected static function booted(): void
    // {
    //     static::created(function (Approval $approval) {
    //         // Notify approver about new approval request
    //         $approver = $approval->approver;
    //         if ($approver && method_exists($approver, 'notify')) {
    //             $module = strtolower(class_basename($approval->approvable_type)) === 'leaverequest' ? 'leave' : 'overtime';
    //             $title = 'Permintaan persetujuan baru';
    //             $message = 'Ada permintaan persetujuan ' . $module . ' baru untuk Anda.';
    //             $approver->notify(new \App\Notifications\ApprovalRequestNotification(
    //                 $module,
    //                 $title,
    //                 $message,
    //                 approvableType: $approval->approvable_type,
    //                 approvableId: (int) $approval->approvable_id,
    //             ));
    //         }
    //     });
    //     static::updated(function (Approval $approval) {
    //         if ($approval->wasChanged('status') && strtolower($approval->status) === 'approved') {
    //             $approval->createNextLayerIfAny();
    //             // Notify sender that current layer approved
    //             $sender = $approval->sender;
    //             if ($sender && method_exists($sender, 'notify')) {
    //                 $module = strtolower(class_basename($approval->approvable_type)) === 'leaverequest' ? 'leave' : 'overtime';
    //                 // $title = 'Permintaan disetujui';
    //                 // $message = 'Permintaan ' . $module . ' Anda disetujui pada salah satu tahap.';
    //                 $title = 'Permintaan disetujui oleh ' . $approval->approver->name;
    //                 $message = 'Permintaan ' . $module . ' Anda disetujui pada salah tahap ' . 1;
    //                 $sender->notify(new \App\Notifications\ApprovalStatusNotification(
    //                     $module,
    //                     $title,
    //                     $message,
    //                     approvableType: $approval->approvable_type,
    //                     approvableId: (int) $approval->approvable_id,
    //                 ));
    //             }
    //         }
    //         if ($approval->wasChanged('status') && strtolower($approval->status) === 'rejected') {
    //             $sender = $approval->sender;
    //             if ($sender && method_exists($sender, 'notify')) {
    //                 $module = strtolower(class_basename($approval->approvable_type)) === 'leaverequest' ? 'leave' : 'overtime';
    //                 $title = 'Permintaan ditolak';
    //                 $message = 'Permintaan ' . $module . ' Anda ditolak.';
    //                 $sender->notify(new \App\Notifications\ApprovalStatusNotification(
    //                     $module,
    //                     $title,
    //                     $message,
    //                     approvableType: $approval->approvable_type,
    //                     approvableId: (int) $approval->approvable_id,
    //                 ));
    //             }
    //         }
    //     });
    // }

    protected function approvableTypeModel(): ?\App\Models\ApprovableType
    {
        return \App\Models\ApprovableType::where('model_class', $this->approvable_type)->first();
    }
    protected function layersCollection()
    {
        $type = $this->approvableTypeModel();
        return $type ? $type->activeApproverLayers()->orderBy('level')->get() : collect();
    }

    public function advanceIfCurrentLevelComplete(): void
    {
        $currentLevel = $this->level;
        if ($currentLevel === null)
            return;

        $incomplete = self::where('approvable_type', $this->approvable_type)
            ->where('approvable_id', $this->approvable_id)
            ->where('status', 'pending')
            ->whereHas('layer', fn($q) => $q->where('level', $currentLevel))
            ->exists();

        if ($incomplete)
            return;

        $this->createNextLayerIfAny();
    }

    /**
     * Create the next layer approval for the same approvable, if a higher level exists.
     */
    public function createNextLayerIfAny(): void
    {
        $type = \App\Models\ApprovableType::where('model_class', $this->approvable_type)->first();
        if (!$type)
            return;

        $layers = $type->activeApproverLayers()->orderBy('level')->get();
        if ($layers->isEmpty())
            return;

        // Identify current layer by resolving the configured layer to a concrete user id
        $currentLayer = $layers->first(function ($layer) {
            $resolvedId = $this->resolveApproverUserId($layer);
            return $resolvedId && (int) $resolvedId === (int) $this->approver_id;
        });

        if (!$currentLayer)
            return;

        $nextLayer = $layers->first(function ($layer) use ($currentLayer) {
            return (int) $layer->level > (int) $currentLayer->level;
        });

        if (!$nextLayer)
            return; // no more layers

        // Resolve next approver concrete user id
        $approverUserId = $this->resolveApproverUserId($nextLayer);
        if (!$approverUserId)
            return;

        // Ensure there's no existing pending approval for the resolved next approver
        $exists = self::where('approvable_type', $this->approvable_type)
            ->where('approvable_id', $this->approvable_id)
            ->where('approver_type', \App\Models\User::class)
            ->where('approver_id', $approverUserId)
            ->where('status', 'pending')
            ->exists();
        if ($exists)
            return;

        self::create([
            'name' => $type->display_name . ' Approval',
            'approvable_id' => $this->approvable_id,
            'approvable_type' => $this->approvable_type,
            'approver_layer_id' => $this->id,                 // ⬅️ referensi layer
            'status' => 'pending',
            'approver_id' => $approverUserId,
            'approver_type' => \App\Models\User::class,
            'sender_id' => $this->sender_id,
            'sender_type' => $this->sender_type,
        ]);
        // $type = $this->approvableTypeModel();
        // $layers = $this->layersCollection();
        // if (!$type || !$this->layer || $layers->isEmpty())
        //     return;

        // $currentLevel = (int) $this->layer->level;
        // $nextLevelValue = optional($layers->first(fn($l) => (int) $l->level > $currentLevel))->level;
        // if ($nextLevelValue === null)
        //     return;

        // $nextLevelLayers = $layers->where('level', (int) $nextLevelValue);

        // foreach ($nextLevelLayers as $layer) {
        //     $approverUserId = $this->resolveApproverUserId($layer);
        //     if (!$approverUserId)
        //         continue;

        //     $exists = self::where('approvable_type', $this->approvable_type)
        //         ->where('approvable_id', $this->approvable_id)
        //         ->where('approver_layer_id', $layer->id)
        //         ->where('approver_id', $approverUserId)
        //         ->where('status', 'pending')
        //         ->exists();
        //     if ($exists)
        //         continue;

        //     self::create([
        //         'name' => $type->display_name . ' Approval',
        //         'approvable_id' => $this->approvable_id,
        //         'approvable_type' => $this->approvable_type,
        //         'approver_layer_id' => $layer->id,                 // ⬅️ referensi layer
        //         'status' => 'pending',
        //         'approver_id' => $approverUserId,
        //         'approver_type' => \App\Models\User::class,
        //         'sender_id' => $this->sender_id,
        //         'sender_type' => $this->sender_type,
        //     ]);
        // }
    }

    protected function resolveApproverUserId($layer): ?int
    {
        // Dynamic: approver is the employee's manager based on approval_line (employee_code)
        if ($layer->approver_type === 'approval_line') {
            $employeeId = optional($this->approvable)->employee_id;
            if ($employeeId) {
                $employee = \App\Models\Employee::with('user')->find($employeeId);
                if ($employee && $employee->approval_line) {
                    $manager = \App\Models\Employee::where('employee_code', $employee->approval_line)
                        ->with('user')
                        ->first();
                    if ($manager && $manager->user) {
                        return (int) $manager->user->id;
                    }
                }
            }
            return null;
        }
        // If layer is a Role, pick a user with that role (special case Manager -> requester.approval_line)
        if ($layer->approver_type === \Spatie\Permission\Models\Role::class) {
            $role = \Spatie\Permission\Models\Role::find($layer->approver_id);
            if (!$role)
                return null;

            if (strtolower($role->name) === 'manager') {
                // Find requester employee via approvable
                $employeeId = optional($this->approvable)->employee_id;
                if ($employeeId) {
                    $employee = \App\Models\Employee::with('user')->find($employeeId);
                    if ($employee && $employee->approval_line) {
                        $manager = \App\Models\Employee::where('employee_code', $employee->approval_line)->with('user')->first();
                        if ($manager && $manager->user)
                            return $manager->user->id;
                    }
                }
            }

            $user = \App\Models\User::role($role->name)->first();
            return $user?->id;
        }

        if ($layer->approver_type === \App\Models\Employee::class) {
            $employee = \App\Models\Employee::with('user')->find($layer->approver_id);
            return $employee?->user?->id;
        }

        if ($layer->approver_type === \App\Models\User::class) {
            return $layer->approver_id;
        }

        return null;
    }
}
