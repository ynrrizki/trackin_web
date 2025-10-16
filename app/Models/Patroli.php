<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patroli extends Model
{
    protected $fillable = [
        'start_time',
        'end_time',
        'note',
        'employee_id',
        'project_id',
        'checkpoint_id',
        'latitude',
        'longitude',
        'status',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_MISSED = 'missed';

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(ClientProject::class, 'project_id');
    }

    public function checkpoint(): BelongsTo
    {
        return $this->belongsTo(PatroliCheckpoint::class, 'checkpoint_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(PatroliFile::class);
    }
}
