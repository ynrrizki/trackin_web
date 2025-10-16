import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// import { Slider } from '@/components/ui/slider';
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
import MapLocationPicker from '@/components/map-location-picker';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { Plus, Edit, Trash2, Clock, MapPin, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'HRMS Settings',
        href: '/settings/hrms',
    },
    {
        title: 'Pengaturan Shift',
        href: '/settings/hrms/shifts',
    },
];

interface Shift {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    employees_count: number;
    created_at: string;
}

interface Props {
    shifts: Shift[];
}

export default function Shifts({ shifts }: Props) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

    const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
        name: '',
        start_time: '',
        end_time: '',
        description: '',
        latitude: '',
        longitude: '',
        radius: '100',
    });

    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        start_time: '',
        end_time: '',
        description: '',
        latitude: '',
        longitude: '',
        radius: '100',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.hrms.shifts.store'), {
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                resetCreate();
            }
        });
    };

    const handleEdit = (shift: Shift) => {
        setEditingShift(shift);
        setEditData({
            name: shift.name,
            start_time: shift.start_time,
            end_time: shift.end_time,
            description: shift.description || '',
            latitude: shift.latitude?.toString() || '',
            longitude: shift.longitude?.toString() || '',
            radius: shift.radius?.toString() || '100',
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingShift) return;

        put(route('settings.hrms.shifts.update', editingShift.id), {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                setEditingShift(null);
                resetEdit();
            }
        });
    };

    const handleDelete = (shift: Shift) => {
        setDeletingShift(shift);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingShift) return;

        router.delete(route('settings.hrms.shifts.destroy', deletingShift.id), {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setDeletingShift(null);
            }
        });
    };

    const formatTime = (time: string) => {
        return new Date(`1970-01-01T${time}`).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Shift" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall
                            title="Pengaturan Shift"
                            description="Kelola shift kerja dan atur penugasan karyawan"
                        />
                        <div className="flex items-center gap-2">
                            <Link href={route('settings.hrms.assign-shifts')}>
                                <Button variant="outline">
                                    <Users className="mr-2 h-4 w-4" />
                                    Assign Shift
                                </Button>
                            </Link>
                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah Shift
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <form onSubmit={handleCreate}>
                                        <DialogHeader>
                                            <DialogTitle>Tambah Shift Baru</DialogTitle>
                                            <DialogDescription>
                                                Tambahkan shift kerja baru untuk digunakan dalam absensi karyawan.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="create-name">Nama Shift</Label>
                                                <Input
                                                    id="create-name"
                                                    value={createData.name}
                                                    onChange={(e) => setCreateData('name', e.target.value)}
                                                    placeholder="Contoh: Shift Pagi, Shift Malam"
                                                />
                                                <InputError message={createErrors.name} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="create-start-time">Jam Mulai</Label>
                                                    <Input
                                                        id="create-start-time"
                                                        type="time"
                                                        value={createData.start_time}
                                                        onChange={(e) => setCreateData('start_time', e.target.value)}
                                                    />
                                                    <InputError message={createErrors.start_time} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="create-end-time">Jam Selesai</Label>
                                                    <Input
                                                        id="create-end-time"
                                                        type="time"
                                                        value={createData.end_time}
                                                        onChange={(e) => setCreateData('end_time', e.target.value)}
                                                    />
                                                    <InputError message={createErrors.end_time} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="create-description">Deskripsi (Opsional)</Label>
                                                <Textarea
                                                    id="create-description"
                                                    value={createData.description}
                                                    onChange={(e) => setCreateData('description', e.target.value)}
                                                    placeholder="Deskripsi singkat tentang shift ini"
                                                    rows={2}
                                                />
                                                <InputError message={createErrors.description} />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="create-latitude">Latitude (Opsional)</Label>
                                                    <Input
                                                        id="create-latitude"
                                                        type="number"
                                                        step="any"
                                                        value={createData.latitude}
                                                        onChange={(e) => setCreateData('latitude', e.target.value)}
                                                        placeholder="-6.2088"
                                                    />
                                                    <InputError message={createErrors.latitude} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="create-longitude">Longitude (Opsional)</Label>
                                                    <Input
                                                        id="create-longitude"
                                                        type="number"
                                                        step="any"
                                                        value={createData.longitude}
                                                        onChange={(e) => setCreateData('longitude', e.target.value)}
                                                        placeholder="106.8456"
                                                    />
                                                    <InputError message={createErrors.longitude} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="create-radius">Radius (meter)</Label>
                                                    <Input
                                                        id="create-radius"
                                                        type="number"
                                                        min="10"
                                                        max="5000"
                                                        value={createData.radius}
                                                        onChange={(e) => setCreateData('radius', e.target.value)}
                                                        placeholder="100"
                                                    />
                                                    <InputError message={createErrors.radius} />
                                                </div>
                                            </div>

                                            {/* Map Location Picker */}
                                            <div className="space-y-2">
                                                <Label>Lokasi Absensi (Opsional)</Label>
                                                <MapLocationPicker
                                                    latitude={parseFloat(createData.latitude) || -6.2088}
                                                    longitude={parseFloat(createData.longitude) || 106.8456}
                                                    radius={parseInt(createData.radius) || 100}
                                                    onLocationChange={(lat, lng) => {
                                                        setCreateData('latitude', lat.toString());
                                                        setCreateData('longitude', lng.toString());
                                                    }}
                                                    onRadiusChange={(radius) => {
                                                        setCreateData('radius', radius.toString());
                                                    }}
                                                    className="h-64 w-full rounded-lg"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Atur lokasi dan radius untuk kontrol absensi karyawan.
                                                    Jika tidak diisi, akan menggunakan default Jakarta.
                                                </p>
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
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <CardTitle>Daftar Shift</CardTitle>
                            </div>
                            <CardDescription>
                                Total {shifts.length} shift terdaftar dalam sistem
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Shift</TableHead>
                                            <TableHead>Jam Kerja</TableHead>
                                            <TableHead>Lokasi</TableHead>
                                            <TableHead>Radius</TableHead>
                                            <TableHead>Deskripsi</TableHead>
                                            <TableHead className="text-center">Karyawan</TableHead>
                                            <TableHead className="text-right">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shifts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">
                                                    Belum ada shift yang terdaftar
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            shifts.map((shift) => (
                                                <TableRow key={shift.id}>
                                                    <TableCell className="font-medium">{shift.name}</TableCell>
                                                    <TableCell>
                                                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {shift.latitude && shift.longitude ? (
                                                            <div className="flex items-center text-sm text-muted-foreground">
                                                                <MapPin className="mr-1 h-3 w-3" />
                                                                {shift.latitude.toFixed(4)}, {shift.longitude.toFixed(4)}
                                                            </div>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {shift.radius ? (
                                                            <Badge variant="secondary">
                                                                {shift.radius}m
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">100m</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{shift.description || '-'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">{shift.employees_count}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(shift)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(shift)}
                                                                disabled={shift.employees_count > 0}
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
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <form onSubmit={handleUpdate}>
                                <DialogHeader>
                                    <DialogTitle>Edit Shift</DialogTitle>
                                    <DialogDescription>
                                        Perbarui informasi shift kerja.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-name">Nama Shift</Label>
                                        <Input
                                            id="edit-name"
                                            value={editData.name}
                                            onChange={(e) => setEditData('name', e.target.value)}
                                            placeholder="Contoh: Shift Pagi, Shift Malam"
                                        />
                                        <InputError message={editErrors.name} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-start-time">Jam Mulai</Label>
                                            <Input
                                                id="edit-start-time"
                                                type="time"
                                                value={editData.start_time}
                                                onChange={(e) => setEditData('start_time', e.target.value)}
                                            />
                                            <InputError message={editErrors.start_time} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-end-time">Jam Selesai</Label>
                                            <Input
                                                id="edit-end-time"
                                                type="time"
                                                value={editData.end_time}
                                                onChange={(e) => setEditData('end_time', e.target.value)}
                                            />
                                            <InputError message={editErrors.end_time} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-description">Deskripsi (Opsional)</Label>
                                        <Textarea
                                            id="edit-description"
                                            value={editData.description}
                                            onChange={(e) => setEditData('description', e.target.value)}
                                            placeholder="Deskripsi singkat tentang shift ini"
                                            rows={2}
                                        />
                                        <InputError message={editErrors.description} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-latitude">Latitude (Opsional)</Label>
                                            <Input
                                                id="edit-latitude"
                                                type="number"
                                                step="any"
                                                value={editData.latitude}
                                                onChange={(e) => setEditData('latitude', e.target.value)}
                                                placeholder="-6.2088"
                                            />
                                            <InputError message={editErrors.latitude} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-longitude">Longitude (Opsional)</Label>
                                            <Input
                                                id="edit-longitude"
                                                type="number"
                                                step="any"
                                                value={editData.longitude}
                                                onChange={(e) => setEditData('longitude', e.target.value)}
                                                placeholder="106.8456"
                                            />
                                            <InputError message={editErrors.longitude} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-radius">Radius (meter)</Label>
                                            <Input
                                                id="edit-radius"
                                                type="number"
                                                min="10"
                                                max="5000"
                                                value={editData.radius}
                                                onChange={(e) => setEditData('radius', e.target.value)}
                                                placeholder="100"
                                            />
                                            <InputError message={editErrors.radius} />
                                        </div>
                                    </div>

                                    {/* Map Location Picker */}
                                    <div className="space-y-2">
                                        <Label>Lokasi Absensi (Opsional)</Label>
                                        <MapLocationPicker
                                            latitude={parseFloat(editData.latitude) || -6.2088}
                                            longitude={parseFloat(editData.longitude) || 106.8456}
                                            radius={parseInt(editData.radius) || 100}
                                            onLocationChange={(lat, lng) => {
                                                setEditData('latitude', lat.toString());
                                                setEditData('longitude', lng.toString());
                                            }}
                                            onRadiusChange={(radius) => {
                                                setEditData('radius', radius.toString());
                                            }}
                                            className="h-64 w-full rounded-lg"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Atur lokasi dan radius untuk kontrol absensi karyawan.
                                        </p>
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
                                    Apakah Anda yakin ingin menghapus shift "{deletingShift?.name}"?
                                    Tindakan ini tidak dapat dibatalkan.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsDeleteDialogOpen(false);
                                        setDeletingShift(null);
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
