<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'industry',
        'status',
        'notes',
        'logo_url'
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function projects(): HasMany
    {
        return $this->hasMany(ClientProject::class);
    }

    public function activeProjects(): HasMany
    {
        return $this->hasMany(ClientProject::class)->where('status', 'ongoing');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(ClientInvoice::class);
    }

    // Helper methods
    public function getStatusBadgeAttribute(): string
    {
        return match($this->status) {
            'active' => '<span class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Active</span>',
            'inactive' => '<span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Inactive</span>',
            'suspended' => '<span class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Suspended</span>',
            default => '<span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Unknown</span>',
        };
    }

    public function getTotalActiveProjectsAttribute(): int
    {
        return $this->activeProjects()->count();
    }
}
