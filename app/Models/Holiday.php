<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use HasFactory;

    protected $fillable = [
        'date','name','is_cuti_bersama'
    ];

    protected $casts = [
        'date' => 'date',
        'is_cuti_bersama' => 'boolean',
    ];
}
