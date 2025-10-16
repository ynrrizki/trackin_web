<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'latitude',
        'longitude',
        'radius',
        'description',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'latitude' => 'float',
        'longitude' => 'float',
        'radius' => 'integer',
    ];

    /**
     * Get the employees that are assigned to this shift.
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * Get the shift projects for this shift.
     */
    public function shiftProjects(): HasMany
    {
        return $this->hasMany(ShiftProject::class);
    }

    /**
     * Get the projects that use this shift through ShiftProject.
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(ClientProject::class, 'shift_projects')
            ->withTimestamps();
    }

    /**
     * Get the effective latitude for this shift.
     * Priority: Shift's own latitude > Project's latitude > null
     */
    public function getEffectiveLatitude(): ?float
    {
        // If shift has its own latitude, use it
        if (!is_null($this->latitude)) {
            return $this->latitude;
        }

        // Otherwise, try to get from the first associated project
        $firstProject = $this->projects()->first();
        if ($firstProject && !is_null($firstProject->latitude)) {
            return (float) $firstProject->latitude;
        }

        return null;
    }

    /**
     * Get the effective longitude for this shift.
     * Priority: Shift's own longitude > Project's longitude > null
     */
    public function getEffectiveLongitude(): ?float
    {
        // If shift has its own longitude, use it
        if (!is_null($this->longitude)) {
            return $this->longitude;
        }

        // Otherwise, try to get from the first associated project
        $firstProject = $this->projects()->first();
        if ($firstProject && !is_null($firstProject->longitude)) {
            return (float) $firstProject->longitude;
        }

        return null;
    }

    /**
     * Get the effective location coordinates for this shift.
     * Returns array with 'latitude' and 'longitude' keys.
     */
    public function getEffectiveLocation(): array
    {
        return [
            'latitude' => $this->getEffectiveLatitude(),
            'longitude' => $this->getEffectiveLongitude(),
        ];
    }

    /**
     * Get the effective radius for this shift.
     * Priority: Shift's own radius > Default 100m
     */
    public function getEffectiveRadius(): int
    {
        return $this->radius ?? 100;
    }

    /**
     * Check if this shift has an effective location (either from itself or project).
     */
    public function hasEffectiveLocation(): bool
    {
        $location = $this->getEffectiveLocation();
        return !is_null($location['latitude']) && !is_null($location['longitude']);
    }
}
