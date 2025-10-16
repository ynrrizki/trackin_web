import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
// import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Security OPS Settings',
        href: '/settings/security-ops',
    },
    {
        title: 'Kategori Kejadian',
        href: '/settings/security-ops/incident-categories',
    },
];

interface Category {
    id: number;

    name: string;
    created_at: string;
    incidents_count: number;
}

interface Props {
    categories: Category[];
}

export default function IncidentCategories({ categories }: Props) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingField, setEditingField] = useState<Category | null>(null);
    const [deletingField, setDeletingField] = useState<Category | null>(null);

    const {
        data: createData,
        setData: setCreateData,
        post,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreate,
    } = useForm({
        name: '',
    });

    const {
        data: editData,
        setData: setEditData,
        put,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm({
        name: '',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.security-ops.incident-categories.store'), {
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                resetCreate();
            },
        });
    };

    const handleEdit = (field: Category) => {
        setEditingField(field);
        setEditData({
            name: field.name,
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingField) return;

        put(route('settings.security-ops.incident-categories.update', editingField.id), {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setEditingField(null);
                resetEdit();
            },
        });
    };

    const handleDelete = (field: Category) => {
        setDeletingField(field);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingField) return;

        router.delete(route('settings.security-ops.incident-categories.destroy', deletingField.id), {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setDeletingField(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bidang Outsourcing" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall title="Kategori Insiden" description="Kelola kategori insiden untuk operasional security" />
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
                                            <Label htmlFor="create-name">Nama Bidang</Label>
                                            <Input
                                                id="create-name"
                                                value={createData.name}
                                                onChange={(e) => setCreateData('name', e.target.value)}
                                                placeholder="Contoh: IT Support, Security, Cleaning"
                                            />
                                            <InputError message={createErrors.name} />
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
                            <CardTitle>Daftar Kategori Insiden</CardTitle>
                            <CardDescription>Total {categories.length} kategori insiden terdaftar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Kategori</TableHead>
                                            <TableHead className="text-center">Jumlah Insiden</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="py-8 text-center">
                                                    Belum ada kategori insiden yang terdaftar
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            categories.map((field) => (
                                                <TableRow key={field.id}>
                                                    <TableCell className="font-medium">{field.name}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">{field.incidents_count}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(field)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(field)}
                                                                disabled={field.incidents_count > 0}
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
                                    <DialogTitle>Edit Kategori Insiden</DialogTitle>
                                    <DialogDescription>Perbarui informasi kategori insiden.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name">Nama Kategori</Label>
                                        <Input
                                            id="edit-name"
                                            value={editData.name}
                                            onChange={(e) => setEditData('name', e.target.value)}
                                            placeholder="Contoh: Gempa, Kebakaran, Banjir"
                                        />
                                        <InputError message={editErrors.name} />
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
                                    Apakah Anda yakin ingin menghapus kategori insiden "{deletingField?.name}"? Tindakan ini tidak dapat dibatalkan.
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
                                <Button type="button" variant="destructive" onClick={confirmDelete}>
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
