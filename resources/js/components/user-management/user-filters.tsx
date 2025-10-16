import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Role, UserWithRoles } from '@/types/role-permission';
import { ChevronDown, Download, Filter, Search, Upload, UserCheck, Users, UserX, X } from 'lucide-react';
import { useState } from 'react';

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

interface UserFiltersProps {
    filters: UserFilterState;
    onFiltersChange: (filters: UserFilterState) => void;
    roles: Role[];
    onReset: () => void;
}

export function UserFilters({ filters, onFiltersChange, roles, onReset }: UserFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const updateFilter = (key: keyof UserFilterState, value: unknown) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        });
    };

    const removeRoleFilter = (roleId: string) => {
        updateFilter(
            'roles',
            filters.roles.filter((id) => id !== roleId),
        );
    };

    const hasActiveFilters = filters.roles.length > 0 || filters.status !== 'all' || filters.hasRoles || filters.hasPermissions || filters.search;

    return (
        <div className="space-y-4">
            {/* Basic Search */}
            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                        placeholder="Cari berdasarkan nama atau email..."
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} className="gap-2">
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                    {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1">
                            {filters.roles.length +
                                (filters.status !== 'all' ? 1 : 0) +
                                (filters.hasRoles ? 1 : 0) +
                                (filters.hasPermissions ? 1 : 0) +
                                (filters.search ? 1 : 0)}
                        </Badge>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Advanced Filters</h4>
                                <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2">
                                    Reset All
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={filters.status}
                                        onValueChange={(value: 'all' | 'active' | 'inactive') => updateFilter('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Role Filter */}
                                <div className="space-y-2">
                                    <Label>Filter by Roles</Label>
                                    <Select
                                        value=""
                                        onValueChange={(value) => {
                                            if (!filters.roles.includes(value)) {
                                                updateFilter('roles', [...filters.roles, value]);
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select roles..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem
                                                    key={role.id}
                                                    value={role.id.toString()}
                                                    disabled={filters.roles.includes(role.id.toString())}
                                                >
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date Range */}
                                <div className="space-y-2">
                                    <Label>Joined Date</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            type="date"
                                            placeholder="From"
                                            value={filters.dateRange.from}
                                            onChange={(e) =>
                                                updateFilter('dateRange', {
                                                    ...filters.dateRange,
                                                    from: e.target.value,
                                                })
                                            }
                                        />
                                        <Input
                                            type="date"
                                            placeholder="To"
                                            value={filters.dateRange.to}
                                            onChange={(e) =>
                                                updateFilter('dateRange', {
                                                    ...filters.dateRange,
                                                    to: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Filters */}
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasRoles"
                                        checked={filters.hasRoles}
                                        onCheckedChange={(checked) => updateFilter('hasRoles', checked)}
                                    />
                                    <Label htmlFor="hasRoles">Has Roles</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="hasPermissions"
                                        checked={filters.hasPermissions}
                                        onCheckedChange={(checked) => updateFilter('hasPermissions', checked)}
                                    />
                                    <Label htmlFor="hasPermissions">Has Direct Permissions</Label>
                                </div>
                            </div>

                            {/* Selected Role Filters */}
                            {filters.roles.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Selected Roles:</Label>
                                    <div className="flex flex-wrap gap-1">
                                        {filters.roles.map((roleId) => {
                                            const role = roles.find((r) => r.id.toString() === roleId);
                                            return (
                                                <Badge key={roleId} variant="secondary" className="flex items-center gap-1 text-xs">
                                                    {role?.name}
                                                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeRoleFilter(roleId)} />
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

interface UserStatsProps {
    users: UserWithRoles[];
    filteredUsers: UserWithRoles[];
}

export function UserStats({ users, filteredUsers }: UserStatsProps) {
    const activeUsers = users.filter((user) => {
        // Assume user is active if email is verified or has roles
        return user.email_verified_at || (user.roles && user.roles.length > 0);
    });

    const usersWithRoles = users.filter((user) => user.roles && user.roles.length > 0);

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Users</p>
                            <p className="text-2xl font-semibold">{users.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                            <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Active Users</p>
                            <p className="text-2xl font-semibold">{activeUsers.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                            <UserX className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">With Roles</p>
                            <p className="text-2xl font-semibold">{usersWithRoles.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                            <Filter className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Filtered</p>
                            <p className="text-2xl font-semibold">{filteredUsers.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface UserExportImportProps {
    users: UserWithRoles[];
    onRefresh: () => void;
}

export function UserExportImport({ users }: UserExportImportProps) {
    const exportUsers = () => {
        const exportData = users.map((user) => ({
            name: user.name,
            email: user.email,
            roles: user.roles?.map((r) => r.name) || [],
            permissions: user.direct_permissions?.map((p) => p.name) || [],
            created_at: user.created_at,
            email_verified_at: user.email_verified_at,
        }));

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Roles', 'Permissions', 'Created At', 'Email Verified'];
        const csvData = users.map((user) => [
            user.name,
            user.email,
            user.roles?.map((r) => r.name).join(';') || '',
            user.direct_permissions?.map((p) => p.name).join(';') || '',
            user.created_at,
            user.email_verified_at || '',
        ]);

        const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportUsers}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
            </Button>
            <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Import
            </Button>
        </div>
    );
}
