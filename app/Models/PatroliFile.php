<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatroliFile extends Model
{
    protected $fillable = [
        'patroli_id',
        'file_path',
    ];

    public function patroli(): BelongsTo
    {
        return $this->belongsTo(Patroli::class);
    }
}
