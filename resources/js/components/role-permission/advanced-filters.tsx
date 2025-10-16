import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Permission, Role, UserWithRoles } from '@/types/role-permission';
import { useForm } from '@inertiajs/react';
import { ChevronDown, Filter, Shield, Users, X } from 'lucide-react';
import { useState } from 'react';

interface FilterState {
    search: string;
    roles: string[];
    hasPermissions: boolean;
    dateRange: {
        from: string;
        to: string;
    };
}

interface AdvancedFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    roles: Role[];
    onReset: () => void;
}

export function AdvancedFilters({ filters, onFiltersChange, roles, onReset }: AdvancedFiltersProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFilter = (key: keyof FilterState, value: any) => {
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

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                    {(filters.roles.length > 0 || filters.hasPermissions || filters.search) && (
                        <Badge variant="secondary" className="ml-1">
                            {filters.roles.length + (filters.hasPermissions ? 1 : 0) + (filters.search ? 1 : 0)}
                        </Badge>
                    )}
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filters</h4>
                        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 px-2">
                            Reset
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Search Users</Label>
                        <Input placeholder="Name or email..." value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} />
                    </div>

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
                                    <SelectItem key={role.id} value={role.id.toString()} disabled={filters.roles.includes(role.id.toString())}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {filters.roles.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
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
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hasPermissions"
                            checked={filters.hasPermissions}
                            onCheckedChange={(checked) => updateFilter('hasPermissions', checked)}
                        />
                        <Label htmlFor="hasPermissions">Has Direct Permissions</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                            <Label>From Date</Label>
                            <Input
                                type="date"
                                value={filters.dateRange.from}
                                onChange={(e) =>
                                    updateFilter('dateRange', {
                                        ...filters.dateRange,
                                        from: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>To Date</Label>
                            <Input
                                type="date"
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
            </PopoverContent>
        </Popover>
    );
}

interface BulkOperationsProps {
    selectedUsers: UserWithRoles[];
    roles: Role[];
    permissions: Permission[];
    onBulkAssignRole: (roleIds: number[]) => void;
    onBulkRemoveRole: (roleIds: number[]) => void;
    onBulkAssignPermission: (permissionIds: number[]) => void;
    onBulkRemovePermission: (permissionIds: number[]) => void;
    onClearSelection: () => void;
}

export function BulkOperations({
    selectedUsers,
    roles,
    permissions,
    onBulkAssignRole,
    onBulkRemoveRole,
    onBulkAssignPermission,
    onBulkRemovePermission,
    onClearSelection,
}: BulkOperationsProps) {
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const [bulkAction, setBulkAction] = useState<'assign-role' | 'remove-role' | 'assign-permission' | 'remove-permission'>('assign-role');

    const { data, setData, reset } = useForm({
        role_ids: [] as number[],
        permission_ids: [] as number[],
    });

    const handleBulkAction = () => {
        if (bulkAction === 'assign-role' && data.role_ids.length > 0) {
            onBulkAssignRole(data.role_ids);
        } else if (bulkAction === 'remove-role' && data.role_ids.length > 0) {
            onBulkRemoveRole(data.role_ids);
        } else if (bulkAction === 'assign-permission' && data.permission_ids.length > 0) {
            onBulkAssignPermission(data.permission_ids);
        } else if (bulkAction === 'remove-permission' && data.permission_ids.length > 0) {
            onBulkRemovePermission(data.permission_ids);
        }

        setShowBulkDialog(false);
        reset();
        onClearSelection();
    };

    if (selectedUsers.length === 0) return null;

    return (
        <>
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">{selectedUsers.length} users selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setBulkAction('assign-role');
                                    setShowBulkDialog(true);
                                }}
                            >
                                <Shield className="mr-1 h-4 w-4" />
                                Assign Roles
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setBulkAction('remove-role');
                                    setShowBulkDialog(true);
                                }}
                            >
                                Remove Roles
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setBulkAction('assign-permission');
                                    setShowBulkDialog(true);
                                }}
                            >
                                Assign Permissions
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setBulkAction('remove-permission');
                                    setShowBulkDialog(true);
                                }}
                            >
                                Remove Permissions
                            </Button>
                            <Button variant="ghost" size="sm" onClick={onClearSelection}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {bulkAction === 'assign-role' && 'Assign Roles'}
                            {bulkAction === 'remove-role' && 'Remove Roles'}
                            {bulkAction === 'assign-permission' && 'Assign Permissions'}
                            {bulkAction === 'remove-permission' && 'Remove Permissions'}
                        </DialogTitle>
                        <DialogDescription>This action will be applied to {selectedUsers.length} selected users.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {(bulkAction === 'assign-role' || bulkAction === 'remove-role') && (
                            <div className="space-y-2">
                                <Label>Select Roles</Label>
                                <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto rounded border p-4">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`bulk-role-${role.id}`}
                                                checked={data.role_ids.includes(role.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setData('role_ids', [...data.role_ids, role.id]);
                                                    } else {
                                                        setData(
                                                            'role_ids',
                                                            data.role_ids.filter((id) => id !== role.id),
                                                        );
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`bulk-role-${role.id}`} className="text-sm">
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {bulkAction === 'assign-permission' && (
                            <div className="space-y-2">
                                <Label>Select Permissions</Label>
                                <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto rounded border p-4">
                                    {permissions.map((permission) => (
                                        <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`bulk-permission-${permission.id}`}
                                                checked={data.permission_ids.includes(permission.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setData('permission_ids', [...data.permission_ids, permission.id]);
                                                    } else {
                                                        setData(
                                                            'permission_ids',
                                                            data.permission_ids.filter((id) => id !== permission.id),
                                                        );
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`bulk-permission-${permission.id}`} className="text-sm">
                                                {permission.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleBulkAction}>Apply to {selectedUsers.length} users</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
