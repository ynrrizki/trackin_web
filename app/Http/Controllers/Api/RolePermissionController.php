<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class RolePermissionController extends Controller
{
    // Roles Management
    public function getRoles()
    {
        try {
            $roles = Role::with('permissions')->get();
            return $this->respondSuccess($roles);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to retrieve roles');
        }
    }

    public function createRole(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|unique:roles,name',
                'permissions' => 'array',
                'permissions.*' => 'exists:permissions,name'
            ]);

            $role = Role::create(['name' => $request->name]);

            if ($request->permissions) {
                $role->givePermissionTo($request->permissions);
            }

            $role->load('permissions');

            return $this->respondCreated($role, false, 'Role created successfully');
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to create role');
        }
    }

    public function updateRole(Request $request, Role $role)
    {
        try {
            $request->validate([
                'name' => 'required|string|unique:roles,name,' . $role->id,
                'permissions' => 'array',
                'permissions.*' => 'exists:permissions,name'
            ]);

            $role->update(['name' => $request->name]);

            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            $role->load('permissions');

            return $this->respondSuccess($role, false, 'Role updated successfully');
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to update role');
        }
    }

    public function deleteRole(Role $role)
    {
        try {
            // Check if role is assigned to any users
            if ($role->users()->count() > 0) {
                return $this->respondError('Cannot delete role that is assigned to users', 400);
            }

            $role->delete();
            return $this->respondSuccess([], false, 'Role deleted successfully');
        } catch (\Exception $e) {
            return $this->respondError500('Failed to delete role');
        }
    }

    // Permissions Management
    public function getPermissions()
    {
        try {
            $permissions = Permission::all()->groupBy(function ($permission) {
                return explode('.', $permission->name)[0];
            });

            return $this->respondSuccess($permissions);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to retrieve permissions');
        }
    }

    public function createPermission(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|unique:permissions,name',
            ]);

            $permission = Permission::create(['name' => $request->name]);
            return $this->respondCreated($permission, false, 'Permission created successfully');
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to create permission');
        }
    }

    // User Role Assignment
    public function assignRoleToUser(Request $request, User $user)
    {
        try {
            // $request->validate([
            //     'roles' => 'required|array',
            //     'roles.*' => 'exists:roles,name'
            // ]);

            $request->validate([
                'role_ids' => 'required|array',
                'role_ids.*' => 'exists:roles,id'
            ]);

            // $user->syncRoles($request->roles);
            // $user->load('roles', 'permissions');

            $user->syncRoles($request->role_ids);
            $user->load('roles', 'permissions');

            return $this->respondSuccess([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ]
            ], false, 'Roles assigned successfully');
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to assign roles');
        }
    }

    public function assignPermissionToUser(Request $request, User $user)
    {
        try {
            // $request->validate([
            //     'permissions' => 'required|array',
            //     'permissions.*' => 'exists:permissions,name'
            // ]);
            $request->validate([
                'permission_ids' => 'required|array',
                'permission_ids.*' => 'exists:permissions,id'
            ]);

            // $user->syncPermissions($request->permissions);
            $user->syncPermissions($request->permission_ids);
            $user->load('roles', 'permissions');

            return $this->respondSuccess([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ]
            ], false, 'Permissions assigned successfully');
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to assign permissions');
        }
    }

    public function removeRoleFromUser(Request $request, User $user)
    {
        try {
            $request->validate([
                'role_ids' => 'required|array',
                'role_ids.*' => 'exists:roles,id'
            ]);

            $rolesToRemove = Role::whereIn('id', $request->role_ids)->get();
            $user->removeRole($rolesToRemove);
            $user->load('roles', 'permissions');

            return $this->respondSuccess([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ]
            ], false, 'Roles removed successfully');
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to remove roles');
        }
    }

    public function removePermissionFromUser(Request $request, User $user)
    {
        try {
            $request->validate([
                'permission_ids' => 'required|array',
                'permission_ids.*' => 'exists:permissions,id'
            ]);

            $permissionsToRemove = Permission::whereIn('id', $request->permission_ids)->get();
            $user->revokePermissionTo($permissionsToRemove);
            $user->load('roles', 'permissions');

            return $this->respondSuccess([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ]
            ], false, 'Permissions removed successfully');
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to remove permissions');
        }
    }

    public function getUserRolesAndPermissions(User $user)
    {
        try {
            $user->load('roles', 'permissions');

            return $this->respondSuccess([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'direct_permissions' => $user->getDirectPermissions()->pluck('name'),
                    'all_permissions' => $user->getAllPermissions()->pluck('name'),
                ]
            ]);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to retrieve user roles and permissions');
        }
    }

    // Quick Setup Methods
    public function quickSetup(Request $request)
    {
        try {
            $request->validate([
                'type' => 'required|in:basic,hrms,complete',
                'overwrite' => 'boolean'
            ]);

            $type = $request->type;
            $overwrite = $request->boolean('overwrite', false);

            $createdPermissions = [];
            $createdRoles = [];

            // Define permission sets based on type
            $permissionSets = $this->getPermissionSets($type);
            $roleSets = $this->getRoleSets($type);

            // Create permissions
            foreach ($permissionSets as $permission) {
                if ($overwrite || !Permission::where('name', $permission)->exists()) {
                    $createdPermissions[] = Permission::updateOrCreate(
                        ['name' => $permission],
                        ['name' => $permission]
                    );
                }
            }

            // Create roles with permissions
            foreach ($roleSets as $roleName => $rolePermissions) {
                if ($overwrite || !Role::where('name', $roleName)->exists()) {
                    $role = Role::updateOrCreate(
                        ['name' => $roleName],
                        ['name' => $roleName]
                    );

                    $role->syncPermissions($rolePermissions);
                    $createdRoles[] = $role;
                }
            }

            return $this->respondSuccess([
                'permissions_created' => count($createdPermissions),
                'roles_created' => count($createdRoles),
                'permissions' => $createdPermissions,
                'roles' => $createdRoles,
            ], false, 'Quick setup completed successfully');

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to complete quick setup: ' . $e->getMessage());
        }
    }

    public function bulkCreatePermissions(Request $request)
    {
        try {
            $request->validate([
                'permissions' => 'required|array',
                'permissions.*' => 'required|string|unique:permissions,name',
                'overwrite' => 'boolean'
            ]);

            $overwrite = $request->boolean('overwrite', false);
            $createdPermissions = [];

            foreach ($request->permissions as $permissionName) {
                if ($overwrite || !Permission::where('name', $permissionName)->exists()) {
                    $createdPermissions[] = Permission::updateOrCreate(
                        ['name' => $permissionName],
                        ['name' => $permissionName]
                    );
                }
            }

            return $this->respondSuccess([
                'permissions_created' => count($createdPermissions),
                'permissions' => $createdPermissions,
            ], false, 'Permissions created successfully');

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to create permissions');
        }
    }

    public function createDefaultRoles(Request $request)
    {
        try {
            $request->validate([
                'type' => 'required|in:basic,hrms,complete',
                'overwrite' => 'boolean'
            ]);

            $type = $request->type;
            $overwrite = $request->boolean('overwrite', false);

            $roleSets = $this->getRoleSets($type);
            $createdRoles = [];

            foreach ($roleSets as $roleName => $rolePermissions) {
                if ($overwrite || !Role::where('name', $roleName)->exists()) {
                    $role = Role::updateOrCreate(
                        ['name' => $roleName],
                        ['name' => $roleName]
                    );

                    // Only assign permissions that exist
                    $existingPermissions = Permission::whereIn('name', $rolePermissions)->pluck('name');
                    $role->syncPermissions($existingPermissions);
                    $createdRoles[] = $role->load('permissions');
                }
            }

            return $this->respondSuccess([
                'roles_created' => count($createdRoles),
                'roles' => $createdRoles,
            ], false, 'Default roles created successfully');

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to create default roles');
        }
    }

    // Helper methods for defining permission and role sets
    private function getPermissionSets($type)
    {
        $basic = [
            // User Management
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',

            // Role & Permission Management
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'permissions.assign',
        ];

        $hrms = [
            // Employee Management
            'employee.view',
            'employee.create',
            'employee.edit',
            'employee.delete',
            'employee.import',
            'employee.export',

            // Department Management
            'department.view',
            'department.create',
            'department.edit',
            'department.delete',

            // Position Management
            'position.view',
            'position.create',
            'position.edit',
            'position.delete',

            // Attendance Management
            'attendance.view',
            'attendance.create',
            'attendance.edit',
            'attendance.delete',
            'attendance.approve',

            // Leave Management
            'leave.view',
            'leave.create',
            'leave.edit',
            'leave.delete',
            'leave.approve',

            // Payroll Management
            'payroll.view',
            'payroll.create',
            'payroll.edit',
            'payroll.delete',
            'payroll.process',

            // Reports
            'reports.view',
            'reports.export',
        ];

        switch ($type) {
            case 'basic':
                return $basic;
            case 'hrms':
                return array_merge($basic, $hrms);
            case 'complete':
                return array_merge($basic, $hrms, [
                    // Additional complete features
                    'settings.view',
                    'settings.edit',
                    'audit.view',
                    'backup.create',
                    'backup.restore',
                ]);
            default:
                return $basic;
        }
    }

    private function getRoleSets($type)
    {
        $basic = [
            'Super Admin' => [
                'users.view',
                'users.create',
                'users.edit',
                'users.delete',
                'roles.view',
                'roles.create',
                'roles.edit',
                'roles.delete',
                'permissions.assign',
            ],
            'Admin' => [
                'users.view',
                'users.create',
                'users.edit',
                'roles.view',
            ],
            'User' => [
                'users.view',
            ],
        ];

        $hrms = [
            'HR Manager' => [
                'employee.view',
                'employee.create',
                'employee.edit',
                'employee.delete',
                'department.view',
                'department.create',
                'department.edit',
                'department.delete',
                'position.view',
                'position.create',
                'position.edit',
                'position.delete',
                'attendance.view',
                'attendance.approve',
                'leave.view',
                'leave.approve',
                'payroll.view',
                'payroll.create',
                'payroll.edit',
                'payroll.process',
                'reports.view',
                'reports.export',
            ],
            'HR Staff' => [
                'employee.view',
                'employee.create',
                'employee.edit',
                'department.view',
                'position.view',
                'attendance.view',
                'leave.view',
                'payroll.view',
                'reports.view',
            ],
            'Manager' => [
                'employee.view',
                'attendance.view',
                'attendance.approve',
                'leave.view',
                'leave.approve',
                'reports.view',
            ],
            'Employee' => [
                'attendance.view',
                'attendance.create',
                'leave.view',
                'leave.create',
            ],
        ];

        switch ($type) {
            case 'basic':
                return $basic;
            case 'hrms':
                return array_merge($basic, $hrms);
            case 'complete':
                $complete = [
                    'System Admin' => [
                        'settings.view',
                        'settings.edit',
                        'audit.view',
                        'backup.create',
                        'backup.restore',
                    ],
                ];
                return array_merge($basic, $hrms, $complete);
            default:
                return $basic;
        }
    }

    public function importRoles(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:json|max:2048',
            ]);

            $file = $request->file('file');
            $content = file_get_contents($file->getRealPath());
            $data = json_decode($content, true);

            if (!$data || !isset($data['roles']) || !isset($data['permissions'])) {
                return $this->respondError('Invalid file format. Expected roles and permissions keys.', 422);
            }

            $createdPermissions = [];
            $createdRoles = [];
            $skippedPermissions = [];
            $skippedRoles = [];

            // Import permissions first
            foreach ($data['permissions'] as $permissionData) {
                if (!isset($permissionData['name']))
                    continue;

                if (Permission::where('name', $permissionData['name'])->exists()) {
                    $skippedPermissions[] = $permissionData['name'];
                    continue;
                }

                $createdPermissions[] = Permission::create([
                    'name' => $permissionData['name']
                ]);
            }

            // Import roles
            foreach ($data['roles'] as $roleData) {
                if (!isset($roleData['name']))
                    continue;

                if (Role::where('name', $roleData['name'])->exists()) {
                    $skippedRoles[] = $roleData['name'];
                    continue;
                }

                $role = Role::create(['name' => $roleData['name']]);

                if (isset($roleData['permissions']) && is_array($roleData['permissions'])) {
                    $validPermissions = Permission::whereIn('name', $roleData['permissions'])->pluck('name');
                    $role->givePermissionTo($validPermissions);
                }

                $createdRoles[] = $role->load('permissions');
            }

            return $this->respondSuccess([
                'permissions_created' => count($createdPermissions),
                'roles_created' => count($createdRoles),
                'permissions_skipped' => count($skippedPermissions),
                'roles_skipped' => count($skippedRoles),
                'skipped_permissions' => $skippedPermissions,
                'skipped_roles' => $skippedRoles,
            ], false, 'Import completed successfully');

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to import roles: ' . $e->getMessage());
        }
    }

    public function quickSetupTemplate(Request $request)
    {
        try {
            $request->validate([
                'template' => 'required|in:basic-hrms,complete-hrms,custom',
                'customRoles' => 'array',
                'customRoles.*.name' => 'required|string',
                'customRoles.*.permissions' => 'array',
                'overwrite' => 'boolean'
            ]);

            $template = $request->template;
            $overwrite = $request->boolean('overwrite', false);
            $createdPermissions = [];
            $createdRoles = [];

            if ($template === 'custom') {
                // Handle custom roles
                foreach ($request->customRoles as $roleData) {
                    if ($overwrite || !Role::where('name', $roleData['name'])->exists()) {
                        // Create permissions if they don't exist
                        foreach ($roleData['permissions'] as $permissionName) {
                            if (!Permission::where('name', $permissionName)->exists()) {
                                $createdPermissions[] = Permission::create(['name' => $permissionName]);
                            }
                        }

                        $role = Role::updateOrCreate(
                            ['name' => $roleData['name']],
                            ['name' => $roleData['name']]
                        );

                        $existingPermissions = Permission::whereIn('name', $roleData['permissions'])->pluck('name');
                        $role->syncPermissions($existingPermissions);
                        $createdRoles[] = $role->load('permissions');
                    }
                }
            } else {
                // Handle predefined templates
                $templateData = $this->getQuickSetupTemplateData($template);

                // Create permissions
                foreach ($templateData['permissions'] as $permissionName) {
                    if ($overwrite || !Permission::where('name', $permissionName)->exists()) {
                        $createdPermissions[] = Permission::updateOrCreate(
                            ['name' => $permissionName],
                            ['name' => $permissionName]
                        );
                    }
                }

                // Create roles
                foreach ($templateData['roles'] as $roleName => $rolePermissions) {
                    if ($overwrite || !Role::where('name', $roleName)->exists()) {
                        $role = Role::updateOrCreate(
                            ['name' => $roleName],
                            ['name' => $roleName]
                        );

                        $existingPermissions = Permission::whereIn('name', $rolePermissions)->pluck('name');
                        $role->syncPermissions($existingPermissions);
                        $createdRoles[] = $role->load('permissions');
                    }
                }
            }

            return $this->respondSuccess([
                'template' => $template,
                'permissions_created' => count($createdPermissions),
                'roles_created' => count($createdRoles),
                'permissions' => $createdPermissions,
                'roles' => $createdRoles,
            ], false, 'Template setup completed successfully');

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return $this->respondError500('Failed to setup template: ' . $e->getMessage());
        }
    }

    private function getQuickSetupTemplateData($template)
    {
        $templates = [
            'basic-hrms' => [
                'permissions' => [
                    'employee.view',
                    'employee.create',
                    'employee.edit',
                    'employee.delete',
                    'attendance.view',
                    'attendance.create',
                    'attendance.edit',
                    'attendance.approve',
                    'profile.view',
                    'profile.edit',
                ],
                'roles' => [
                    'HR Manager' => ['employee.view', 'employee.create', 'employee.edit', 'attendance.view', 'attendance.approve'],
                    'HR Staff' => ['employee.view', 'attendance.view'],
                    'Employee' => ['profile.view', 'attendance.view'],
                ],
            ],
            'complete-hrms' => [
                'permissions' => [
                    // Employee permissions
                    'employee.view',
                    'employee.create',
                    'employee.edit',
                    'employee.delete',
                    'employee.import',
                    'employee.export',

                    // Attendance permissions
                    'attendance.view',
                    'attendance.create',
                    'attendance.edit',
                    'attendance.delete',
                    'attendance.approve',

                    // Leave permissions
                    'leave.view',
                    'leave.create',
                    'leave.edit',
                    'leave.delete',
                    'leave.approve',

                    // Payroll permissions
                    'payroll.view',
                    'payroll.create',
                    'payroll.edit',
                    'payroll.delete',
                    'payroll.process',

                    // Profile permissions
                    'profile.view',
                    'profile.edit',

                    // Department permissions
                    'department.view',
                    'department.create',
                    'department.edit',
                    'department.delete',

                    // Position permissions
                    'position.view',
                    'position.create',
                    'position.edit',
                    'position.delete',

                    // Reports permissions
                    'reports.view',
                    'reports.export',

                    // User management
                    'users.view',
                    'users.create',
                    'users.edit',
                    'users.delete',
                    'roles.view',
                    'roles.create',
                    'roles.edit',
                    'roles.delete',
                    'permissions.assign',
                ],
                'roles' => [
                    'Super Admin' => [
                        'employee.view',
                        'employee.create',
                        'employee.edit',
                        'employee.delete',
                        'employee.import',
                        'employee.export',
                        'attendance.view',
                        'attendance.create',
                        'attendance.edit',
                        'attendance.delete',
                        'attendance.approve',
                        'leave.view',
                        'leave.create',
                        'leave.edit',
                        'leave.delete',
                        'leave.approve',
                        'payroll.view',
                        'payroll.create',
                        'payroll.edit',
                        'payroll.delete',
                        'payroll.process',
                        'department.view',
                        'department.create',
                        'department.edit',
                        'department.delete',
                        'position.view',
                        'position.create',
                        'position.edit',
                        'position.delete',
                        'reports.view',
                        'reports.export',
                        'users.view',
                        'users.create',
                        'users.edit',
                        'users.delete',
                        'roles.view',
                        'roles.create',
                        'roles.edit',
                        'roles.delete',
                        'permissions.assign',
                    ],
                    'HR Manager' => [
                        'employee.view',
                        'employee.create',
                        'employee.edit',
                        'employee.delete',
                        'attendance.view',
                        'attendance.approve',
                        'leave.view',
                        'leave.approve',
                        'payroll.view',
                        'department.view',
                        'department.create',
                        'department.edit',
                        'position.view',
                        'position.create',
                        'position.edit',
                        'reports.view',
                        'reports.export',
                    ],
                    'HR Staff' => [
                        'employee.view',
                        'employee.create',
                        'employee.edit',
                        'attendance.view',
                        'attendance.create',
                        'attendance.edit',
                        'leave.view',
                        'department.view',
                        'position.view',
                        'reports.view',
                    ],
                    'Manager' => [
                        'employee.view',
                        'attendance.view',
                        'attendance.approve',
                        'leave.view',
                        'leave.approve',
                        'reports.view',
                    ],
                    'Payroll Staff' => [
                        'employee.view',
                        'payroll.view',
                        'payroll.create',
                        'payroll.edit',
                        'payroll.process',
                        'reports.view',
                    ],
                    'Employee' => [
                        'profile.view',
                        'profile.edit',
                        'attendance.view',
                        'attendance.create',
                        'leave.view',
                        'leave.create',
                    ],
                ],
            ],
        ];

        return $templates[$template] ?? $templates['basic-hrms'];
    }
}
