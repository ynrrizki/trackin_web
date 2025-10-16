import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Permission, Role, UserWithRoles } from '@/types/role-permission';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { Edit, Shield, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface AssignRoleDialogProps {
    user: UserWithRoles;
    roles: Role[];
    onSuccess?: () => void;
}

export function AssignRoleDialog({ user, roles, onSuccess }: AssignRoleDialogProps) {
    const [open, setOpen] = useState(false);
    const { data, setData, processing } = useForm({
        role_ids: user.roles.map((role) => role.id),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // post(`/api/users/${user.id}/assign-roles`, {
        //     onSuccess: () => {
        //         toast.success('Role berhasil diperbarui');
        //         setOpen(false);
        //         onSuccess?.();
        //     },
        //     onError: () => {
        //         toast.error('Gagal memperbarui role');
        //     },
        // });
        try {
            await axios.post(`/api/users/${user.id}/assign-roles`, {
                role_ids: data.role_ids,
            });
            toast.success('Role berhasil diperbarui');
            setOpen(false);
            onSuccess?.();
        } catch {
            toast.error('Gagal memperbarui role');
            return;
        }
    };

    const handleRoleChange = (roleId: number, checked: boolean) => {
        if (checked) {
            setData('role_ids', [...data.role_ids, roleId]);
        } else {
            setData(
                'role_ids',
                data.role_ids.filter((id) => id !== roleId),
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Shield className="mr-2 h-4 w-4" />
                    Assign Role
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Roles</DialogTitle>
                    <DialogDescription>Pilih roles untuk user {user.name}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Available Roles</Label>
                            <div className="max-h-60 space-y-2 overflow-y-auto">
                                {roles.map((role) => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`role-${role.id}`}
                                            checked={data.role_ids.includes(role.id)}
                                            onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                                        />
                                        <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer text-sm font-normal">
                                            {role.name}
                                            <span className="ml-2 text-gray-500">({role.permissions?.length || 0} permissions)</span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface AssignPermissionDialogProps {
    user: UserWithRoles;
    permissions: Permission[];
    onSuccess?: () => void;
}

export function AssignPermissionDialog({ user, permissions, onSuccess }: AssignPermissionDialogProps) {
    const [open, setOpen] = useState(false);
    const { data, setData, processing } = useForm({
        permission_ids: user.direct_permissions?.map((permission) => permission.id) || [],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // post(`/api/users/${user.id}/assign-permissions`, {
        //     onSuccess: () => {
        //         toast.success('Permission berhasil diperbarui');
        //         setOpen(false);
        //         onSuccess?.();
        //     },
        //     onError: () => {
        //         toast.error('Gagal memperbarui permission');
        //     },
        // });
        try {
            await axios.post(`/api/users/${user.id}/assign-permissions`, {
                permission_ids: data.permission_ids,
            });
            toast.success('Permission berhasil diperbarui');
            setOpen(false);
            onSuccess?.();
        } catch {
            toast.error('Gagal memperbarui permission');
            return;
        }
    };

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        if (checked) {
            setData('permission_ids', [...data.permission_ids, permissionId]);
        } else {
            setData(
                'permission_ids',
                data.permission_ids.filter((id) => id !== permissionId),
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Direct Permissions
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Direct Permissions</DialogTitle>
                    <DialogDescription>Berikan permissions langsung kepada user {user.name} (terpisah dari role)</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Available Permissions</Label>
                            <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-4">
                                {permissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`permission-${permission.id}`}
                                            checked={data.permission_ids.includes(permission.id)}
                                            onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                                        />
                                        <Label htmlFor={`permission-${permission.id}`} className="cursor-pointer text-sm font-normal">
                                            {permission.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface UserManagementTableProps {
    users: UserWithRoles[];
    roles: Role[];
    permissions: Permission[];
    onUserUpdate?: () => void;
}

export function UserManagementTable({ users, roles, permissions, onUserUpdate }: UserManagementTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Direct Permissions</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar>
                                            <AvatarFallback>
                                                <User className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles.map((role) => (
                                            <Badge key={role.id} variant="secondary">
                                                {role.name}
                                            </Badge>
                                        ))}
                                        {user.roles.length === 0 && <span className="text-sm text-gray-500">No roles</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm text-gray-600">{user.direct_permissions?.length || 0} permissions</div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <AssignRoleDialog user={user} roles={roles} onSuccess={onUserUpdate} />
                                        <AssignPermissionDialog user={user} permissions={permissions} onSuccess={onUserUpdate} />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
