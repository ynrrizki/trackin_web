import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Permission, Role } from '@/types/role-permission';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { AlertTriangle, Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateRoleDialogProps {
    permissions: Permission[];
    onSuccess?: () => void;
}

export function CreateRoleDialog({ permissions, onSuccess }: CreateRoleDialogProps) {
    const [open, setOpen] = useState(false);
    const { data, setData, processing, errors, reset } = useForm({
        name: '',
        permission_ids: [] as number[],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // post('/api/roles', {
        //     onSuccess: () => {
        //         toast.success('Role berhasil dibuat');
        //         setOpen(false);
        //         reset();
        //         onSuccess?.();
        //     },
        //     onError: () => {
        //         toast.error('Gagal membuat role');
        //     },
        // });
        try {
            await axios.post('/api/roles', {
                name: data.name,
                permission_ids: data.permission_ids,
            });
            toast.success('Role berhasil dibuat');
            setOpen(false);
            reset();
            onSuccess?.();
        } catch (error) {
            // const errorMessage = error?.response?.data?.message || 'Gagal membuat role';
            // toast.error(errorMessage);
            toast.error('Gagal membuat role');
            console.error('Error creating role:', error);
            setOpen(false); // Close dialog on error to prevent confusion
            reset(); // Reset form data to clear any previous input
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
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Role
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Role Baru</DialogTitle>
                    <DialogDescription>Buat role baru dan tentukan permissions yang akan diberikan.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Role</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Masukkan nama role..."
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label>Permissions</Label>
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

interface EditRoleDialogProps {
    role: Role;
    permissions: Permission[];
    onSuccess?: () => void;
}

export function EditRoleDialog({ role, permissions, onSuccess }: EditRoleDialogProps) {
    const [open, setOpen] = useState(false);
    const { data, setData, processing, errors } = useForm({
        name: role.name,
        permission_ids: role.permissions?.map((p) => p.id) || [],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // put(`/api/roles/${role.id}`, {
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
            await axios.put(`/api/roles/${role.id}`, {
                name: data.name,
                permission_ids: data.permission_ids,
            });
            toast.success('Role berhasil diperbarui');
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            // const errorMessage = error?.response?.data?.message || 'Gagal memperbarui role';
            // toast.error(errorMessage);
            toast.error('Gagal memperbarui role');
            console.error('Error updating role:', error);
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
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Role</DialogTitle>
                    <DialogDescription>Ubah nama role dan permissions yang diberikan.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Role</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Masukkan nama role..."
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label>Permissions</Label>
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

interface DeleteConfirmationDialogProps {
    role: Role;
    onConfirm: () => void;
}

function DeleteConfirmationDialog({ role, onConfirm }: DeleteConfirmationDialogProps) {
    const [open, setOpen] = useState(false);

    const handleConfirm = () => {
        onConfirm();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Konfirmasi Hapus
                    </DialogTitle>
                    <DialogDescription>
                        Apakah Anda yakin ingin menghapus role <strong>"{role.name}"</strong>?
                        <br />
                        <br />
                        Role ini memiliki <strong>{role.permissions?.length || 0} permissions</strong>. Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Batal
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleConfirm}>
                        Ya, Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface RoleCardProps {
    role: Role;
    permissions: Permission[];
    onEdit?: () => void;
    onDelete?: (id: number) => void;
}

export function RoleCard({ role, permissions, onEdit, onDelete }: RoleCardProps) {
    const handleDelete = () => {
        onDelete?.(role.id);
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        <CardDescription>{role.permissions?.length || 0} permissions</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <EditRoleDialog role={role} permissions={permissions} onSuccess={onEdit} />
                        <DeleteConfirmationDialog role={role} onConfirm={handleDelete} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-1">
                    {role.permissions?.slice(0, 6).map((permission) => (
                        <Badge key={permission.id} variant="secondary" className="text-xs">
                            {permission.name}
                        </Badge>
                    ))}
                    {(role.permissions?.length || 0) > 6 && (
                        <Badge variant="outline" className="text-xs">
                            +{(role.permissions?.length || 0) - 6} more
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
