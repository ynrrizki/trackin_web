<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class AuthorizationController extends Controller
{
    public function index()
    {
        // Get all roles with their permissions
        $roles = Role::with('permissions')->get();

        // Get all permissions
        $permissions = Permission::all();

        // Get all users with their roles and permissions
        $users = User::with(['roles.permissions', 'permissions'])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'roles' => $user->roles,
                    'permissions' => $user->permissions,
                    'direct_permissions' => $user->getDirectPermissions(),
                    'all_permissions' => $user->getAllPermissions(),
                ];
            });

        return Inertia::render('settings/role-permission/page', [
            'roles' => $roles,
            'permissions' => $permissions,
            'users' => $users,
        ]);
    }
}
