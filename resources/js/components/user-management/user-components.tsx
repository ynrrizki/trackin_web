import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Role, UserWithRoles } from '@/types/role-permission';
import { useForm } from '@inertiajs/react';
import { Calendar, Edit, Eye, EyeOff, Key, Mail, Plus, Shield, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateUserDialogProps {
    roles: Role[];
    onSuccess?: () => void;
}

export function CreateUserDialog({ roles, onSuccess }: CreateUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_ids: [] as number[],
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/api/users', {
            onSuccess: () => {
                toast.success('User berhasil dibuat');
                setOpen(false);
                reset();
                onSuccess?.();
            },
            onError: () => {
                toast.error('Gagal membuat user');
            },
        });
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
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah User
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Tambah User Baru</DialogTitle>
                    <DialogDescription>Buat user baru dan tentukan roles yang akan diberikan.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Masukkan nama lengkap..."
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Masukkan email..."
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Masukkan password..."
                                    className={errors.password ? 'border-red-500' : ''}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Konfirmasi password..."
                                className={errors.password_confirmation ? 'border-red-500' : ''}
                            />
                            {errors.password_confirmation && <p className="text-sm text-red-500">{errors.password_confirmation}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label>Roles</Label>
                            <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border p-3">
                                {roles.map((role) => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`role-${role.id}`}
                                            checked={data.role_ids.includes(role.id)}
                                            onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                                        />
                                        <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer text-sm font-normal">
                                            {role.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked.valueOf() === 'true' || true)}
                            />
                            <Label htmlFor="is_active">User aktif</Label>
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

interface EditUserDialogProps {
    user: UserWithRoles;
    roles: Role[];
    onSuccess?: () => void;
}

export function EditUserDialog({ user, roles, onSuccess }: EditUserDialogProps) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        role_ids: user.roles?.map((r) => r.id) || [],
        is_active: true, // Assume active by default
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/api/users/${user.id}`, {
            onSuccess: () => {
                toast.success('User berhasil diperbarui');
                setOpen(false);
                onSuccess?.();
            },
            onError: () => {
                toast.error('Gagal memperbarui user');
            },
        });
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
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>Update informasi user dan roles yang diberikan.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Nama Lengkap</Label>
                            <Input
                                id="edit-name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Masukkan nama lengkap..."
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Masukkan email..."
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label>Roles</Label>
                            <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border p-3">
                                {roles.map((role) => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-role-${role.id}`}
                                            checked={data.role_ids.includes(role.id)}
                                            onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                                        />
                                        <Label htmlFor={`edit-role-${role.id}`} className="flex-1 cursor-pointer text-sm font-normal">
                                            {role.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="edit-is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked.valueOf() === 'true' || true)}
                            />
                            <Label htmlFor="edit-is_active">User aktif</Label>
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

interface UserCardProps {
    user: UserWithRoles;
    roles: Role[];
    onEdit?: () => void;
    onDelete?: (id: number) => void;
}

export function UserCard({ user, roles, onEdit, onDelete }: UserCardProps) {
    const handleDelete = () => {
        if (confirm(`Apakah Anda yakin ingin menghapus user "${user.name}"?`)) {
            onDelete?.(user.id);
        }
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
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base">{user.name}</CardTitle>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Mail className="h-3 w-3" />
                                {user.email}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <EditUserDialog user={user} roles={roles} onSuccess={onEdit} />
                        <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div>
                        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
                            <Shield className="h-3 w-3" />
                            Roles
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role) => (
                                <Badge key={role.id} variant="secondary" className="text-xs">
                                    {role.name}
                                </Badge>
                            ))}
                            {(!user.roles || user.roles.length === 0) && <span className="text-sm text-gray-500">No roles assigned</span>}
                        </div>
                    </div>

                    <div>
                        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
                            <Key className="h-3 w-3" />
                            Direct Permissions
                        </div>
                        <div className="text-sm text-gray-600">{user.direct_permissions?.length || 0} permissions</div>
                    </div>

                    <div>
                        <div className="mb-1 flex items-center gap-1 text-sm font-medium">
                            <Calendar className="h-3 w-3" />
                            Joined
                        </div>
                        <div className="text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString('id-ID')}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
