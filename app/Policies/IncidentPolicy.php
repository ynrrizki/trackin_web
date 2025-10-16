<?php

namespace App\Policies;

use App\Models\Incident;
use App\Models\Employee;
use App\Models\User;

class IncidentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('incident.view') || $user->can('incident.view_all') || $user->hasRole('Security Supervisor');
    }

    public function view(User $user, Incident $incident): bool
    {
        if ($user->can('incident.view_all')) return true;
        if ($user->can('incident.view')) return true; // listing already filtered in controller
        return false;
    }

    public function create(User $user): bool
    {
        return $user->can('incident.create');
    }
}
