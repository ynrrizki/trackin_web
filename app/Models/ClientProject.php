<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClientProject extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'outsourcing_field_id',
        'code',
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'latitude',
        'longitude',
        'required_agents',
        'status',
        'contract_start',
        'contract_end',
        'hourly_rate',
        'monthly_rate',
        'special_requirements',
        'notes'
    ];

    protected $casts = [
        'contract_start' => 'datetime',
        'contract_end' => 'datetime',
        'hourly_rate' => 'decimal:2',
        'monthly_rate' => 'decimal:2',
        'deleted_at' => 'datetime',
    ];

    // Relationships
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function outsourceField(): BelongsTo
    {
        return $this->belongsTo(OutsourcingField::class, 'outsourcing_field_id');
    }

    public function shiftProjects(): HasMany
    {
        return $this->hasMany(ShiftProject::class);
    }

    public function shiftAssignments()
    {
        return ShiftAssignment::whereIn('shift_id', $this->shifts()->pluck('id'));
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(ClientInvoice::class);
    }

    public function employeeProjects(): HasMany
    {
        return $this->hasMany(EmployeeProject::class, 'project_id');
    }

    public function assignedEmployees(): BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'employee_projects', 'project_id', 'employee_id')
            ->withTimestamps();
    }

    // Security Ops: Patroli checkpoints linked to this project
    public function patroliCheckpoints(): HasMany
    {
        return $this->hasMany(\App\Models\PatroliCheckpoint::class, 'project_id');
    }

    /**
     * Get the shifts assigned to this project through ShiftProject.
     */
    public function shifts(): BelongsToMany
    {
        return $this->belongsToMany(Shift::class, 'shift_projects', 'client_project_id', 'shift_id')
            ->withTimestamps();
    }

    // Helper methods
    public function getStatusBadgeAttribute(): string
    {
        return match ($this->status) {
            'tender' => '<span class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">Tender</span>',
            'won' => '<span class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">Menang</span>',
            'lost' => '<span class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">Kalah</span>',
            'cancelled' => '<span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Dibatalkan</span>',
            default => '<span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">Unknown</span>',
        };
    }

    public function getContractPeriodAttribute(): string
    {
        if (!$this->contract_start)
            return 'Belum ditentukan';

        $start = $this->contract_start->format('d M Y');
        $end = $this->contract_end ? $this->contract_end->format('d M Y') : 'Ongoing';

        return $start . ' - ' . $end;
    }

    public function formatCurrency($amount): string
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }

    // Current Agents / Employee base on the outsource project or have a outsourcing_field_id with same
    public function getCurrentAgentsCountAttribute(): int
    {
        return $this->employeeProjects()
            ->whereHas('employee', function ($query) {
                $query->where('status', 'active')
                      ->where('outsourcing_field_id', $this->outsourcing_field_id);
            })
            ->count();
    }

    public function getGuardsStatusAttribute(): string
    {
        $current = $this->current_agents_count;
        $required = $this->required_agents;

        if ($current == $required) {
            return '<span class="text-green-600 font-medium">Terpenuhi (' . $current . '/' . $required . ')</span>';
        } elseif ($current < $required) {
            return '<span class="text-red-600 font-medium">Kurang (' . $current . '/' . $required . ')</span>';
        } else {
            return '<span class="text-blue-600 font-medium">Lebih (' . $current . '/' . $required . ')</span>';
        }
    }

    public function checkpoints()
    {
        return $this->hasMany(\App\Models\PatroliCheckpoint::class, 'project_id');
    }
}
