import { AdvancedFilters, BulkOperations } from '@/components/role-permission/advanced-filters';
import { ExportImportTools, QuickSetup } from '@/components/role-permission/export-import-tools';
import { MobileRoleCard, MobileUserCard, ResponsiveLayout, useIsMobile } from '@/components/role-permission/mobile-components';
import { CreateRoleDialog, RoleCard } from '@/components/role-permission/role-management';
import { UserManagementTable } from '@/components/role-permission/user-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLoadingState, usePagination } from '@/hooks/useTableUtils';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Permission, Role, UserWithRoles } from '@/types/role-permission';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Grid, Key, List, RefreshCw, Search, Shield, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Settings',
        href: '/settings',
    },
    {
        title: 'Role & Permission',
        href: '/settings/role-permission',
    },
];

interface RolePermissionPageProps {
    roles: Role[];
    permissions: Permission[];
    users: UserWithRoles[];
}

interface FilterState {
    search: string;
    roles: string[];
    hasPermissions: boolean;
    dateRange: {
        from: string;
        to: string;
    };
}

export default function RolePermissionPage({ roles, permissions, users }: RolePermissionPageProps) {
    const isMobile = useIsMobile();
    const { isLoading, execute } = useLoadingState();
    const [selectedUsers, setSelectedUsers] = useState<UserWithRoles[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filters state
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        roles: [],
        hasPermissions: false,
        dateRange: { from: '', to: '' },
    });

    // Pagination for users
    const userPagination = usePagination({ initialPerPage: isMobile ? 5 : 10 });
    const rolePagination = usePagination({ initialPerPage: isMobile ? 6 : 12 });

    // Filter data based on current filters
    const filteredUsers = users.filter((user) => {
        if (
            filters.search &&
            !user.name.toLowerCase().includes(filters.search.toLowerCase()) &&
            !user.email.toLowerCase().includes(filters.search.toLowerCase())
        ) {
            return false;
        }

        if (filters.roles.length > 0) {
            const userRoleIds = user.roles.map((r) => r.id.toString());
            if (!filters.roles.some((roleId) => userRoleIds.includes(roleId))) {
                return false;
            }
        }

        if (filters.hasPermissions && (!user.direct_permissions || user.direct_permissions.length === 0)) {
            return false;
        }

        return true;
    });

    const filteredRoles = roles.filter((role) => !filters.search || role.name.toLowerCase().includes(filters.search.toLowerCase()));

    // Paginated data
    const paginatedUsers = userPagination.paginateData(filteredUsers);
    const paginatedRoles = rolePagination.paginateData(filteredRoles);

    // Update pagination search terms
    // only update pagination when search term changes
    useEffect(() => {
        userPagination.setSearchTerm(filters.search);
        rolePagination.setSearchTerm(filters.search);
    }, [filters.search, rolePagination, userPagination]);

    const handleDeleteRole = (roleId: number) => {
        execute(async () => {
            // router.delete(`/api/roles/${roleId}`, {
            //     onSuccess: () => {
            //         toast.success('Role berhasil dihapus');
            //         handleRefresh();
            //     },
            //     onError: () => {
            //         toast.error('Gagal menghapus role');
            //     },
            // });
            try {
                await axios.delete(`/api/roles/${roleId}`);
                toast.success('Role berhasil dihapus');
                handleRefresh();
            } catch {
                toast.error('Gagal menghapus role');
            }
        });
    };

    const handleRefresh = () => {
        execute(async () => {
            router.reload();
        });
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            roles: [],
            hasPermissions: false,
            dateRange: { from: '', to: '' },
        });
    };

    const handleUserSelect = (user: UserWithRoles, selected: boolean) => {
        if (selected) {
            setSelectedUsers((prev) => [...prev, user]);
        } else {
            setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
        }
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === paginatedUsers.data.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(paginatedUsers.data);
        }
    };

    const handleBulkAssignRole = (roleIds: number[]) => {
        execute(async () => {
            const promises = selectedUsers.map((user) =>
                // fetch(`/api/users/${user.id}/assign-roles`, {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ role_ids: roleIds }),
                // }),
                axios.post(
                    `/api/users/${user.id}/assign-roles`,
                    {
                        role_ids: roleIds,
                    },
                    {
                        headers: { 'Content-Type': 'application/json' },
                    },
                ),
            );

            await Promise.all(promises);
            toast.success(`Roles assigned to ${selectedUsers.length} users`);
            handleRefresh();
        });
    };

    const handleBulkRemoveRole = (roleIds: number[]) => {
        execute(async () => {
            const promises = selectedUsers.map((user) =>
                // fetch(`/api/users/${user.id}/remove-roles`, {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ role_ids: roleIds }),
                // }),
                axios.post(
                    `/api/users/${user.id}/remove-roles`,
                    {
                        role_ids: roleIds,
                    },
                    {
                        headers: { 'Content-Type': 'application/json' },
                    },
                ),
            );

            await Promise.all(promises);
            toast.success(`Roles removed from ${selectedUsers.length} users`);
            handleRefresh();
        });
    };

    const handleBulkAssignPermission = (permissionIds: number[]) => {
        execute(async () => {
            const promises = selectedUsers.map((user) =>
                axios.post(
                    `/api/users/${user.id}/assign-permissions`,
                    {
                        permission_ids: permissionIds,
                    },
                    {
                        headers: { 'Content-Type': 'application/json' },
                    },
                ),
            );

            await Promise.all(promises);
            toast.success(`Permissions assigned to ${selectedUsers.length} users`);
            handleRefresh();
        });
    };

    const handleBulkRemovePermission = (permissionIds: number[]) => {
        execute(async () => {
            const promises = selectedUsers.map((user) =>
                axios.post(
                    `/api/users/${user.id}/remove-permissions`,
                    {
                        permission_ids: permissionIds,
                    },
                    {
                        headers: { 'Content-Type': 'application/json' },
                    },
                ),
            );

            await Promise.all(promises);
            toast.success(`Permissions removed from ${selectedUsers.length} users`);
            handleRefresh();
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role & Permission Management" />
            <SettingsLayout className="md:max-w-6xl">
                <ResponsiveLayout isMobile={isMobile}>
                    <div className="flex flex-col gap-6">
                        {/* Header */}
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <h1 className="text-2xl font-semibold">Role & Permission Management</h1>
                                    <p className="text-gray-600">Kelola roles, permissions, dan user assignments</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <ExportImportTools roles={roles} permissions={permissions} onRefresh={handleRefresh} />
                                    <QuickSetup onSetupComplete={handleRefresh} />
                                </div>
                            </div>

                            {/* Search and Filters */}
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                                    <Input
                                        placeholder="Cari roles atau users..."
                                        value={filters.search}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                                        className="pl-10"
                                    />
                                </div>
                                <AdvancedFilters filters={filters} onFiltersChange={setFilters} roles={roles} onReset={resetFilters} />
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                            <Shield className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Roles</p>
                                            <p className="text-2xl font-semibold">{roles.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                                            <Key className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Permissions</p>
                                            <p className="text-2xl font-semibold">{permissions.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                                            <Users className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Users</p>
                                            <p className="text-2xl font-semibold">{users.length}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Bulk Operations */}
                        <BulkOperations
                            selectedUsers={selectedUsers}
                            roles={roles}
                            permissions={permissions}
                            onBulkAssignRole={handleBulkAssignRole}
                            onBulkRemoveRole={handleBulkRemoveRole}
                            onBulkAssignPermission={handleBulkAssignPermission}
                            onBulkRemovePermission={handleBulkRemovePermission}
                            onClearSelection={() => setSelectedUsers([])}
                        />

                        {/* Main Content */}
                        <Tabs defaultValue="roles" className="space-y-6">
                            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                <TabsTrigger value="roles">Role Management</TabsTrigger>
                                <TabsTrigger value="users">User Management</TabsTrigger>
                            </TabsList>

                            <TabsContent value="roles" className="space-y-6">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <div>
                                        <h2 className="text-lg font-semibold">Roles</h2>
                                        <p className="text-sm text-gray-600">Kelola roles dan permissions yang tersedia</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isMobile && (
                                            <div className="flex items-center gap-1 rounded-md border p-1">
                                                <Button
                                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    onClick={() => setViewMode('grid')}
                                                >
                                                    <Grid className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                                    size="sm"
                                                    onClick={() => setViewMode('list')}
                                                >
                                                    <List className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <CreateRoleDialog permissions={permissions} onSuccess={handleRefresh} />
                                    </div>
                                </div>

                                {isMobile ? (
                                    <div className="space-y-3">
                                        {paginatedRoles.data.map((role) => (
                                            <MobileRoleCard
                                                key={role.id}
                                                role={role}
                                                permissions={permissions}
                                                onEdit={handleRefresh}
                                                onDelete={handleDeleteRole}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
                                        {paginatedRoles.data.map((role) => (
                                            <RoleCard
                                                key={role.id}
                                                role={role}
                                                permissions={permissions}
                                                onEdit={handleRefresh}
                                                onDelete={handleDeleteRole}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Pagination for Roles */}
                                {paginatedRoles.totalPages > 1 && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            Showing {paginatedRoles.from} to {paginatedRoles.to} of {paginatedRoles.total} roles
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => rolePagination.goToPage(rolePagination.currentPage - 1)}
                                                disabled={rolePagination.currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm">
                                                {rolePagination.currentPage} of {paginatedRoles.totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => rolePagination.goToPage(rolePagination.currentPage + 1)}
                                                disabled={rolePagination.currentPage === paginatedRoles.totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {paginatedRoles.data.length === 0 && (
                                    <div className="py-12 text-center">
                                        <Shield className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                        <h3 className="mb-2 text-lg font-medium text-gray-900">Tidak ada roles</h3>
                                        <p className="mb-4 text-gray-600">
                                            {filters.search ? 'Tidak ada roles yang sesuai dengan pencarian' : 'Mulai dengan membuat role pertama'}
                                        </p>
                                        {!filters.search && <CreateRoleDialog permissions={permissions} onSuccess={handleRefresh} />}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="users" className="space-y-6">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <div>
                                        <h2 className="text-lg font-semibold">User Management</h2>
                                        <p className="text-sm text-gray-600">Assign roles dan permissions kepada users</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={userPagination.perPage.toString()}
                                            onValueChange={(value) => userPagination.changePerPage(Number(value))}
                                        >
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5 per page</SelectItem>
                                                <SelectItem value="10">10 per page</SelectItem>
                                                <SelectItem value="20">20 per page</SelectItem>
                                                <SelectItem value="50">50 per page</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {!isMobile && paginatedUsers.data.length > 0 && (
                                            <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                                {selectedUsers.length === paginatedUsers.data.length ? 'Deselect All' : 'Select All'}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {isMobile ? (
                                    <div className="space-y-3">
                                        {paginatedUsers.data.map((user) => (
                                            <MobileUserCard
                                                key={user.id}
                                                user={user}
                                                isSelected={selectedUsers.some((u) => u.id === user.id)}
                                                onSelect={(selected) => handleUserSelect(user, selected)}
                                                onAssignRole={() => {
                                                    /* Handle assign role */
                                                }}
                                                onAssignPermission={() => {
                                                    /* Handle assign permission */
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <UserManagementTable
                                        users={paginatedUsers.data}
                                        roles={roles}
                                        permissions={permissions}
                                        onUserUpdate={handleRefresh}
                                    />
                                )}

                                {/* Pagination for Users */}
                                {paginatedUsers.totalPages > 1 && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            Showing {paginatedUsers.from} to {paginatedUsers.to} of {paginatedUsers.total} users
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => userPagination.goToPage(userPagination.currentPage - 1)}
                                                disabled={userPagination.currentPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm">
                                                {userPagination.currentPage} of {paginatedUsers.totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => userPagination.goToPage(userPagination.currentPage + 1)}
                                                disabled={userPagination.currentPage === paginatedUsers.totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {paginatedUsers.data.length === 0 && (
                                    <div className="py-12 text-center">
                                        <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                        <h3 className="mb-2 text-lg font-medium text-gray-900">Tidak ada users</h3>
                                        <p className="text-gray-600">
                                            {filters.search || filters.roles.length > 0 || filters.hasPermissions
                                                ? 'Tidak ada users yang sesuai dengan filter yang dipilih'
                                                : 'Belum ada users yang terdaftar'}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </ResponsiveLayout>
            </SettingsLayout>
        </AppLayout>
    );
}
