<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ApprovalStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $moduleType, // 'leave' | 'overtime'
        public string $title,
        public string $message,
        public ?string $approvableType = null,
        public ?int $approvableId = null,
        public ?string $approvalStatus = null,   // ⬅️ baru
        public ?int $level = null,               // ⬅️ baru
        public ?int $approverId = null,          // ⬅️ opsional
        public ?string $approverName = null      // ⬅️ opsional
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'approval',
            'module' => $this->moduleType,
            'title' => $this->title,
            'message' => $this->message,
            'approvable_type' => $this->approvableType,
            'approvable_id' => $this->approvableId,
            'approval_status' => $this->approvalStatus, // ⬅️ penting
            'level' => $this->level,
            'approver_id' => $this->approverId,
            'approver_name' => $this->approverName,
        ];
    }
}
