import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'CRM Settings',
        href: '/settings/crm',
    },
    {
        title: 'Bidang Outsourcing',
        href: '/settings/crm/outsourcing-fields',
    },
];

interface OutsourcingField {
    id: number;
    code: string;
    name: string;
    description?: string;
    projects_count: number;
    employees_count: number;
    created_at: string;
}

interface Props {
    outsourcingFields: OutsourcingField[];
}

export default function OutsourcingFields({ outsourcingFields }: Props) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingField, setEditingField] = useState<OutsourcingField | null>(null);
    const [deletingField, setDeletingField] = useState<OutsourcingField | null>(null);

    const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
        code: '',
        name: '',
        description: '',
    });

    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        code: '',
        name: '',
        description: '',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.crm.outsourcing-fields.store'), {
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                resetCreate();
            }
        });
    };

    const handleEdit = (field: OutsourcingField) => {
        setEditingField(field);
        setEditData({
            code: field.code,
            name: field.name,
            description: field.description || '',
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingField) return;

        put(route('settings.crm.outsourcing-fields.update', editingField.id), {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setEditingField(null);
                resetEdit();
            }
        });
    };

    const handleDelete = (field: OutsourcingField) => {
        setDeletingField(field);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingField) return;

        router.delete(route('settings.crm.outsourcing-fields.destroy', deletingField.id), {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setDeletingField(null);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bidang Outsourcing" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall
                            title="Bidang Outsourcing"
                            description="Kelola bidang-bidang outsourcing untuk proyek dan karyawan"
                        />
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Bidang
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handleCreate}>
                                    <DialogHeader>
                                        <DialogTitle>Tambah Bidang Outsourcing</DialogTitle>
                                        <DialogDescription>
                                            Tambahkan bidang outsourcing baru untuk digunakan dalam proyek dan pengelolaan karyawan.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="create-code">Kode Bidang</Label>
                                            <Input
                                                id="create-code"
                                                value={createData.code}
                                                onChange={(e) => setCreateData('code', e.target.value)}
                                                placeholder="Contoh: IT, SEC, CLN"
                                                maxLength={10}
                                            />
                                            <InputError message={createErrors.code} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="create-name">Nama Bidang</Label>
                                            <Input
                                                id="create-name"
                                                value={createData.name}
                                                onChange={(e) => setCreateData('name', e.target.value)}
                                                placeholder="Contoh: IT Support, Security, Cleaning"
                                            />
                                            <InputError message={createErrors.name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="create-description">Deskripsi (Opsional)</Label>
                                            <Textarea
                                                id="create-description"
                                                value={createData.description}
                                                onChange={(e) => setCreateData('description', e.target.value)}
                                                placeholder="Deskripsi singkat tentang bidang outsourcing ini"
                                                rows={3}
                                            />
                                            <InputError message={createErrors.description} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                            Batal
                                        </Button>
                                        <Button type="submit" disabled={createProcessing}>
                                            {createProcessing ? 'Menyimpan...' : 'Simpan'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Bidang Outsourcing</CardTitle>
                            <CardDescription>
                                Total {outsourcingFields.length} bidang outsourcing terdaftar
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kode</TableHead>
                                            <TableHead>Nama Bidang</TableHead>
                                            <TableHead>Deskripsi</TableHead>
                                            <TableHead className="text-center">Proyek</TableHead>
                                            <TableHead className="text-center">Karyawan</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {outsourcingFields.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    Belum ada bidang outsourcing yang terdaftar
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            outsourcingFields.map((field) => (
                                                <TableRow key={field.id}>
                                                    <TableCell className="font-mono text-sm">{field.code}</TableCell>
                                                    <TableCell className="font-medium">{field.name}</TableCell>
                                                    <TableCell>{field.description || '-'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">{field.projects_count}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">{field.employees_count}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(field)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(field)}
                                                                disabled={field.projects_count > 0 || field.employees_count > 0}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edit Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <form onSubmit={handleUpdate}>
                                <DialogHeader>
                                    <DialogTitle>Edit Bidang Outsourcing</DialogTitle>
                                    <DialogDescription>
                                        Perbarui informasi bidang outsourcing.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-code">Kode Bidang</Label>
                                        <Input
                                            id="edit-code"
                                            value={editData.code}
                                            onChange={(e) => setEditData('code', e.target.value)}
                                            placeholder="Contoh: IT, SEC, CLN"
                                            maxLength={10}
                                        />
                                        <InputError message={editErrors.code} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name">Nama Bidang</Label>
                                        <Input
                                            id="edit-name"
                                            value={editData.name}
                                            onChange={(e) => setEditData('name', e.target.value)}
                                            placeholder="Contoh: IT Support, Security, Cleaning"
                                        />
                                        <InputError message={editErrors.name} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-description">Deskripsi (Opsional)</Label>
                                        <Textarea
                                            id="edit-description"
                                            value={editData.description}
                                            onChange={(e) => setEditData('description', e.target.value)}
                                            placeholder="Deskripsi singkat tentang bidang outsourcing ini"
                                            rows={3}
                                        />
                                        <InputError message={editErrors.description} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={editProcessing}>
                                        {editProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Konfirmasi Hapus</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin menghapus bidang outsourcing "{deletingField?.name}"?
                                    Tindakan ini tidak dapat dibatalkan.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsDeleteDialogOpen(false);
                                        setDeletingField(null);
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={confirmDelete}
                                >
                                    Hapus
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
