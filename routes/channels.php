<?php

use Illuminate\Support\Facades\Broadcast;

// Register broadcasting auth route for web (SPA)
Broadcast::routes();

// Also expose an API-prefixed broadcasting auth route for mobile (Bearer Sanctum)
// Broadcast::routes([
//     'middleware' => ['auth:sanctum'],
//     'prefix' => 'api',
// ]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Presence channel for employee tracking (online presence + live location)
Broadcast::channel('employee-tracking', function ($user) {
    // Provide minimal member info to the presence channel
    if ($user) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'employee_id' => optional($user->employee)->id,
        ];
    }
});
