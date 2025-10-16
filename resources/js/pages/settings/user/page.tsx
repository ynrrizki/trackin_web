import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InviteUserDialog } from '@/components/user-management/invite-user-dialog';
import { EditUserDialog, UserCard } from '@/components/user-management/user-components';
import { UserExportImport, UserFilters, UserStats } from '@/components/user-management/user-filters';
import { useLoadingState, usePagination } from '@/hooks/useTableUtils';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Role, UserWithRoles } from '@/types/role-permission';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Calendar, Grid, List, Mail, RefreshCw, Shield, Trash2, Users as UsersIcon } from 'lucide-react';
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
        title: 'Users',
        href: '/settings/user',
    },
];

interface UserFilterState {
    search: string;
    roles: string[];
    status: 'all' | 'active' | 'inactive';
    hasRoles: boolean;
    hasPermissions: boolean;
    dateRange: {
        from: string;
        to: string;
    };
}

interface UserPageProps {
    users: UserWithRoles[];
    roles: Role[];
}

export default function UserPage({ users, roles }: UserPageProps) {
    const { isLoading, execute } = useLoadingState();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Filters state
    const [filters, setFilters] = useState<UserFilterState>({
        search: '',
        roles: [],
        status: 'all',
        hasRoles: false,
        hasPermissions: false,
        dateRange: { from: '', to: '' },
    });

    // Pagination
    const pagination = usePagination({ initialPerPage: 10 });

    // Filter users based on current filters
    const filteredUsers = users.filter((user) => {
        // Search filter
        if (
            filters.search &&
            !user.name.toLowerCase().includes(filters.search.toLowerCase()) &&
            !user.email.toLowerCase().includes(filters.search.toLowerCase())
        ) {
            return false;
        }

        // Role filter
        if (filters.roles.length > 0) {
            const userRoleIds = user.roles?.map((r) => r.id.toString()) || [];
            if (!filters.roles.some((roleId) => userRoleIds.includes(roleId))) {
                return false;
            }
        }

        // Status filter
        if (filters.status !== 'all') {
            const isActive = user.email_verified_at || (user.roles && user.roles.length > 0);
            if (filters.status === 'active' && !isActive) return false;
            if (filters.status === 'inactive' && isActive) return false;
        }

        // Has roles filter
        if (filters.hasRoles && (!user.roles || user.roles.length === 0)) {
            return false;
        }

        // Has permissions filter
        if (filters.hasPermissions && (!user.direct_permissions || user.direct_permissions.length === 0)) {
            return false;
        }

        // Date range filter
        if (filters.dateRange.from || filters.dateRange.to) {
            const userDate = new Date(user.created_at);
            if (filters.dateRange.from && userDate < new Date(filters.dateRange.from)) {
                return false;
            }
            if (filters.dateRange.to && userDate > new Date(filters.dateRange.to)) {
                return false;
            }
        }

        return true;
    });

    // Paginated data
    const paginatedUsers = pagination.paginateData(filteredUsers);

    // Update pagination search term
    useEffect(() => {
        pagination.setSearchTerm(filters.search);
    }, [filters.search, pagination]);

    const handleDeleteUser = (userId: number) => {
        execute(async () => {
            // router.delete(`/api/users/${userId}`, {
            //     onSuccess: () => {
            //         toast.success('User berhasil dihapus');
            //         handleRefresh();
            //     },
            //     onError: () => {
            //         toast.error('Gagal menghapus user');
            //     },
            // });
            try {
                await axios.delete(`/api/users/${userId}`);
                toast.success('User berhasil dihapus');
                handleRefresh();
            } catch {
                toast.error('Gagal menghapus user');
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
            status: 'all',
            hasRoles: false,
            hasPermissions: false,
            dateRange: { from: '', to: '' },
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />
            <SettingsLayout className="md:max-w-6xl">
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h1 className="text-2xl font-semibold">User Management</h1>
                                <p className="text-gray-600">Kelola users, roles, dan permissions dalam sistem</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                                <UserExportImport users={users} onRefresh={handleRefresh} />
                                <InviteUserDialog roles={roles} onSuccess={handleRefresh} />
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <UserStats users={users} filteredUsers={filteredUsers} />

                    {/* Filters */}
                    <UserFilters filters={filters} onFiltersChange={setFilters} roles={roles} onReset={resetFilters} />

                    {/* View Controls */}
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="text-sm text-gray-600">
                            Showing {paginatedUsers.from} to {paginatedUsers.to} of {paginatedUsers.total} users
                            {filteredUsers.length !== users.length && <span className="ml-1">(filtered from {users.length} total)</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={pagination.perPage.toString()} onValueChange={(value) => pagination.changePerPage(Number(value))}>
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
                            <div className="flex items-center gap-1 rounded-md border p-1">
                                <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
                                    <Grid className="h-4 w-4" />
                                </Button>
                                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* User List */}
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {paginatedUsers.data.map((user) => (
                                <UserCard key={user.id} user={user} roles={roles} onEdit={handleRefresh} onDelete={handleDeleteUser} />
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Roles</TableHead>
                                            <TableHead>Permissions</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedUsers.data.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={user.avatar} />
                                                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{user.name}</div>
                                                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3 text-gray-400" />
                                                        {user.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles?.map((role) => (
                                                            <Badge key={role.id} variant="secondary" className="text-xs">
                                                                {role.name}
                                                            </Badge>
                                                        ))}
                                                        {(!user.roles || user.roles.length === 0) && (
                                                            <span className="text-sm text-gray-500">No roles</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Shield className="h-3 w-3" />
                                                        {user.direct_permissions?.length || 0} direct
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(user.created_at).toLocaleDateString('id-ID')}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <EditUserDialog user={user} roles={roles} onSuccess={handleRefresh} />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pagination */}
                    {paginatedUsers.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Page {pagination.currentPage} of {paginatedUsers.totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => pagination.goToPage(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => pagination.goToPage(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === paginatedUsers.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {paginatedUsers.data.length === 0 && (
                        <div className="py-12 text-center">
                            <UsersIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                            <h3 className="mb-2 text-lg font-medium text-gray-900">Tidak ada users</h3>
                            <p className="mb-4 text-gray-600">
                                {filteredUsers.length === 0 && users.length > 0
                                    ? 'Tidak ada users yang sesuai dengan filter yang dipilih'
                                    : 'Mulai dengan membuat user pertama'}
                            </p>
                            {filteredUsers.length === 0 && users.length === 0 && <InviteUserDialog roles={roles} onSuccess={handleRefresh} />}
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
