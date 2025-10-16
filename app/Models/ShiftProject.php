<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftProject extends Model
{
    protected $fillable = [
        'name',
        'shift_id',
        'client_project_id',
    ];

    // Relationships
    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function clientProject()
    {
        return $this->belongsTo(ClientProject::class);
    }
}
