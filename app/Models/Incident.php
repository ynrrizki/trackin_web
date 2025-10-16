<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Employee;

class Incident extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporter_employee_id',
        'assigned_to_employee_id',
        'category_id',
        'incident_at',
        'long',
        'lat',
        'location',
        'related_name',
        'related_status',
        'description',
        'severity',
        'priority',
        'status',
        'handling_steps',
        'follow_up_actions',
        'resolution_notes',
        'resolved_at',
        'photo_url',
    ];

    protected $casts = [
        'incident_at' => 'datetime',
        'resolved_at' => 'datetime',
        'follow_up_actions' => 'array',
    ];

    // Status constants
    const STATUS_REPORTED = 'reported';
    const STATUS_INVESTIGATING = 'investigating';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_CLOSED = 'closed';

    // Priority constants
    const PRIORITY_LOW = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_CRITICAL = 'critical';

    /**
     * Get all available statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_REPORTED => 'Dilaporkan',
            self::STATUS_INVESTIGATING => 'Sedang Diselidiki',
            self::STATUS_RESOLVED => 'Terselesaikan',
            self::STATUS_CLOSED => 'Ditutup',
        ];
    }

    /**
     * Get all available priorities
     */
    public static function getPriorities(): array
    {
        return [
            self::PRIORITY_LOW => 'Rendah',
            self::PRIORITY_MEDIUM => 'Sedang',
            self::PRIORITY_HIGH => 'Tinggi',
            self::PRIORITY_CRITICAL => 'Kritis',
        ];
    }

    /**
     * Get human readable status
     */
    public function getStatusLabelAttribute(): string
    {
        return self::getStatuses()[$this->status] ?? $this->status;
    }

    /**
     * Get human readable priority
     */
    public function getPriorityLabelAttribute(): string
    {
        return self::getPriorities()[$this->priority] ?? $this->priority;
    }

    /**
     * Relasi ke kategori insiden
     */
    public function category()
    {
        return $this->belongsTo(IncidentCategory::class, 'category_id');
    }

    public function reporter()
    {
        return $this->belongsTo(Employee::class, 'reporter_employee_id');
    }

    /**
     * Relasi ke petugas yang ditugaskan
     */
    public function assignedTo()
    {
        return $this->belongsTo(Employee::class, 'assigned_to_employee_id');
    }
}
