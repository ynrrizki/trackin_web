<?php

namespace App\Providers;

use App\Models\Incident;
use App\Models\User;
use App\Policies\IncidentPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Incident::class => IncidentPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Gate fallback (optional)
        Gate::before(function ($user, $ability) {
            if ($user->hasRole('Super Admin')) {
                return true;
            }
            return null;
        });

        Gate::define('viewLogViewer', function (?User $user) {
            if ($user && $user->hasRole('Super Admin')) {
                return true;
            }
            return false;
        });
    }
}
