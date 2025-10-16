<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OutsourcingField extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description', // Additional description of the outsourcing field
        'status', // active or inactive
    ];

    /**
     * Get the projects for this outsourcing field.
     */
    public function projects(): HasMany
    {
        return $this->hasMany(ClientProject::class);
    }

    /**
     * Get the employees for this outsourcing field.
     */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
