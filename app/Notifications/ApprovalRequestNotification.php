<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $moduleType, // 'leave' | 'overtime' | ...
        public string $title,
        public string $message,
        public ?string $approvableType = null,
        public ?int $approvableId = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        // database for in-app list; broadcast for realtime push channels
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'approval',
            'module' => $this->moduleType,
            'title' => $this->title,
            'message' => $this->message,
            // Provide approvable identifiers so clients can take action
            'approvable_type' => $this->approvableType,
            'approvable_id' => $this->approvableId,
        ];
    }
}
