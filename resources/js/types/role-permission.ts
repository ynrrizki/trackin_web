export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    permissions?: Permission[];
    permissions_count?: number;
}

export interface UserWithRoles extends User {
    roles: Role[];
    permissions: Permission[];
    direct_permissions: Permission[];
    all_permissions: Permission[];
}

export interface RolePermissionData {
    roles: Role[];
    permissions: Permission[];
    users: UserWithRoles[];
}

export interface AssignRoleRequest {
    role_ids: number[];
}

export interface AssignPermissionRequest {
    permission_ids: number[];
}

export interface CreateRoleRequest {
    name: string;
    permission_ids?: number[];
}

export interface UpdateRoleRequest {
    name: string;
    permission_ids?: number[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    roles?: Role[];
    permissions?: Permission[];
    [key: string]: unknown;
}
