<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PatroliCheckpoint extends Model
{
    protected $fillable = [
        'project_id',
        'name',
        'description',
        'latitude',
        'longitude',
        'radius_m',
        'sequence',
        'active',
        'meta',
    ];

    protected $casts = [
        'active' => 'boolean',
        'meta' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(ClientProject::class, 'project_id');
    }

    public function patrols(): HasMany
    {
        return $this->hasMany(Patroli::class, 'checkpoint_id');
    }
}
