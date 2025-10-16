import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit, Trash2, CalendarDays } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'HRMS Settings', href: '/settings/hrms' },
  { title: 'Hari Libur', href: '/settings/hrms/holidays' },
];

interface Holiday { id: number; date: string; name: string; is_cuti_bersama: boolean; }
type HolidayForm = { date: string; name: string; is_cuti_bersama: boolean };
interface Props { holidays: Holiday[] }

export default function HolidaysPage({ holidays }: Props) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);

  const { data: createData, setData: setCreate, post, processing: creating, errors: createErrors, reset: resetCreate } = useForm<HolidayForm>({
    date: '', name: '', is_cuti_bersama: false,
  });
  const { data: editData, setData: setEdit, put, processing: updating, errors: editErrors, reset: resetEdit } = useForm<HolidayForm>({
    date: '', name: '', is_cuti_bersama: false,
  });

  const onCreate = (e: React.FormEvent) => { e.preventDefault(); post(route('settings.hrms.holidays.store'), { onSuccess: () => { setIsCreateOpen(false); resetCreate(); } }); };
  const openEdit = (h: Holiday) => { setEditing(h); setEdit({ date: h.date.substring(0,10), name: h.name, is_cuti_bersama: h.is_cuti_bersama }); setIsEditOpen(true); };
  const onUpdate = (e: React.FormEvent) => { e.preventDefault(); if (!editing) return; put(route('settings.hrms.holidays.update', editing.id), { onSuccess: () => { setIsEditOpen(false); setEditing(null); resetEdit(); } }); };
  const onDelete = (id: number) => { router.delete(route('settings.hrms.holidays.destroy', id)); };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Hari Libur" />
      <SettingsLayout>
        <div className="flex items-center justify-between">
          <HeadingSmall title="Hari Libur Kantor" description="Kelola kalender hari libur nasional dan cuti bersama" />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Tambah Hari Libur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <form onSubmit={onCreate}>
                <DialogHeader>
                  <DialogTitle>Hari Libur Baru</DialogTitle>
                  <DialogDescription>Tambahkan hari libur kantor</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={createData.date} onChange={e=>setCreate('date', e.target.value)} /><InputError message={createErrors.date} /></div>
                  <div className="space-y-2"><Label>Nama</Label><Input value={createData.name} onChange={e=>setCreate('name', e.target.value)} /><InputError message={createErrors.name} /></div>
                  <div className="space-y-2 col-span-2">
                    <Label>Kategori</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={createData.is_cuti_bersama ? 'secondary':'outline'} onClick={()=>setCreate('is_cuti_bersama', true)}>Cuti Bersama</Button>
                      <Button type="button" variant={!createData.is_cuti_bersama ? 'secondary':'outline'} onClick={()=>setCreate('is_cuti_bersama', false)}>Libur Nasional</Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={()=>setIsCreateOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={creating}>{creating ? 'Menyimpan...' : 'Simpan'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Daftar Hari Libur</CardTitle>
            </div>
            <CardDescription>Total {holidays.length} hari</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">Belum ada hari libur</TableCell></TableRow>
                  ) : holidays.map(h => (
                    <TableRow key={h.id}>
                      <TableCell>{h.date.substring(0,10)}</TableCell>
                      <TableCell>{h.name}</TableCell>
                      <TableCell>
                        <Badge variant={h.is_cuti_bersama ? 'secondary':'outline'}>{h.is_cuti_bersama ? 'Cuti Bersama' : 'Libur Nasional'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={()=>openEdit(h)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={()=>onDelete(h.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-xl">
            <form onSubmit={onUpdate}>
              <DialogHeader>
                <DialogTitle>Edit Hari Libur</DialogTitle>
                <DialogDescription>Perbarui data hari libur</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={editData.date} onChange={e=>setEdit('date', e.target.value)} /><InputError message={editErrors.date} /></div>
                <div className="space-y-2"><Label>Nama</Label><Input value={editData.name} onChange={e=>setEdit('name', e.target.value)} /><InputError message={editErrors.name} /></div>
                <div className="space-y-2 col-span-2">
                  <Label>Kategori</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={editData.is_cuti_bersama ? 'secondary':'outline'} onClick={()=>setEdit('is_cuti_bersama', true)}>Cuti Bersama</Button>
                    <Button type="button" variant={!editData.is_cuti_bersama ? 'secondary':'outline'} onClick={()=>setEdit('is_cuti_bersama', false)}>Libur Nasional</Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={()=>setIsEditOpen(false)}>Batal</Button>
                <Button type="submit" disabled={updating}>{updating ? 'Menyimpan...' : 'Simpan'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SettingsLayout>
    </AppLayout>
  );
}
