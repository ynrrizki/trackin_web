<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserLocationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $userId,
        public ?int $employeeId,
        public float $lat,
        public float $lng,
        public DutyStatus $duty = DutyStatus::NOT_STARTED,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('employee-tracking')];
    }

    public function broadcastAs(): string
    {
        return 'user.location-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'employee_id' => $this->employeeId,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'duty' => $this->duty->value,
        ];
    }
}

