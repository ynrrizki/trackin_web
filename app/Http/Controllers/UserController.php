<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
        // Get all users with their roles and permissions
        $users = User::with(['roles.permissions', 'permissions'])
            ->latest()
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar ?? null,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'roles' => $user->roles,
                    'permissions' => $user->permissions,
                    'direct_permissions' => $user->getDirectPermissions(),
                    'all_permissions' => $user->getAllPermissions(),
                ];
            });

        // Get all roles for user assignment
        $roles = Role::with('permissions')->get();

        return Inertia::render('settings/user/page', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
            'is_active' => 'boolean',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'email_verified_at' => $validated['is_active'] ?? true ? now() : null,
        ]);

        // Assign roles if provided
        if (!empty($validated['role_ids'])) {
            $roles = Role::whereIn('id', $validated['role_ids'])->get();
            $user->assignRole($roles);
        }

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load(['roles', 'permissions'])
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role_ids' => 'array',
            'role_ids.*' => 'exists:roles,id',
            'is_active' => 'boolean',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'email_verified_at' => $validated['is_active'] ?? true ? ($user->email_verified_at ?? now()) : null,
        ]);

        // Sync roles
        if (isset($validated['role_ids'])) {
            $roles = Role::whereIn('id', $validated['role_ids'])->get();
            $user->syncRoles($roles);
        }

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load(['roles', 'permissions'])
        ]);
    }

    public function destroy(User $user)
    {
        // Remove all roles and permissions before deleting
        $user->syncRoles([]);
        $user->syncPermissions([]);

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }
}
