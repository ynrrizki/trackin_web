<?php

namespace App\Models;

use App\HasApprovable;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use HasApprovable;
}
