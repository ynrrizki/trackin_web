import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'HRMS Settings', href: '/settings/hrms' },
  { title: 'Cuti & Kategori', href: '/settings/hrms/leave-categories' },
];

interface Category {
  id: number;
  code: string;
  name: string;
  is_paid: boolean;
  deduct_balance: boolean;
  half_day_allowed: boolean;
  weekend_rule: 'workdays' | 'calendar';
  base_quota_days?: number | null;
  prorate_on_join: boolean;
  prorate_on_resign: boolean;
  carryover_max_days?: number | null;
  carryover_expiry_months?: number | null;
  requires_proof: boolean;
}

interface Props { categories: Category[] }

export default function LeaveCategories({ categories }: Props) {
  type FormState = {
    code: string;
    name: string;
    is_paid: boolean;
    deduct_balance: boolean;
    half_day_allowed: boolean;
    weekend_rule: 'workdays' | 'calendar';
    base_quota_days: string;
    prorate_on_join: boolean;
    prorate_on_resign: boolean;
    carryover_max_days: string;
    carryover_expiry_months: string;
    requires_proof: boolean;
  };
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const { data: createData, setData: setCreate, post, processing: creating, errors: createErrors, reset: resetCreate } = useForm<FormState>({
    code: '', name: '', is_paid: true, deduct_balance: true, half_day_allowed: false, weekend_rule: 'workdays', base_quota_days: '',
    prorate_on_join: true, prorate_on_resign: true, carryover_max_days: '', carryover_expiry_months: '', requires_proof: false,
  });

  const { data: editData, setData: setEdit, put, processing: updating, errors: editErrors, reset: resetEdit } = useForm<FormState>({
    code: '', name: '', is_paid: true, deduct_balance: true, half_day_allowed: false, weekend_rule: 'workdays', base_quota_days: '',
    prorate_on_join: true, prorate_on_resign: true, carryover_max_days: '', carryover_expiry_months: '', requires_proof: false,
  });

  const onCreate = (e: React.FormEvent) => { e.preventDefault(); post(route('settings.hrms.leave-categories.store'), { onSuccess: () => { setIsCreateOpen(false); resetCreate(); } }); };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setEdit({
      code: cat.code,
      name: cat.name,
      is_paid: cat.is_paid,
      deduct_balance: cat.deduct_balance,
      half_day_allowed: cat.half_day_allowed,
      weekend_rule: cat.weekend_rule,
      base_quota_days: (cat.base_quota_days ?? '').toString(),
      prorate_on_join: cat.prorate_on_join,
      prorate_on_resign: cat.prorate_on_resign,
      carryover_max_days: (cat.carryover_max_days ?? '').toString(),
      carryover_expiry_months: (cat.carryover_expiry_months ?? '').toString(),
      requires_proof: cat.requires_proof,
    });
    setIsEditOpen(true);
  };

  const onUpdate = (e: React.FormEvent) => { e.preventDefault(); if (!editing) return; put(route('settings.hrms.leave-categories.update', editing.id), { onSuccess: () => { setIsEditOpen(false); setEditing(null); resetEdit(); } }); };

  const onDelete = (id: number) => { router.delete(route('settings.hrms.leave-categories.destroy', id)); };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Cuti & Kategori" />
      <SettingsLayout>
        <div className="flex items-center justify-between">
          <HeadingSmall title="Kategori Cuti" description="Kelola kategori cuti dan aturan dasar sesuai regulasi Indonesia dan kebijakan perusahaan" />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <form onSubmit={onCreate}>
                <DialogHeader>
                  <DialogTitle>Kategori Baru</DialogTitle>
                  <DialogDescription>Set kategori dan aturan dasar</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2"><Label>Kode</Label><Input value={createData.code} onChange={e=>setCreate('code', e.target.value)} /><InputError message={createErrors.code} /></div>
                  <div className="space-y-2"><Label>Nama</Label><Input value={createData.name} onChange={e=>setCreate('name', e.target.value)} /><InputError message={createErrors.name} /></div>
                  <div className="space-y-2"><Label>Sifat Hari</Label><Select value={createData.weekend_rule} onValueChange={(v)=>setCreate('weekend_rule', v as 'workdays' | 'calendar')}><SelectTrigger><SelectValue placeholder="Workdays" /></SelectTrigger><SelectContent><SelectItem value="workdays">Workdays</SelectItem><SelectItem value="calendar">Calendar days</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Kuota Dasar (hari)</Label><Input type="number" value={createData.base_quota_days} onChange={e=>setCreate('base_quota_days', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Carryover Maks</Label><Input type="number" value={createData.carryover_max_days} onChange={e=>setCreate('carryover_max_days', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Carryover Expiry (bulan)</Label><Input type="number" value={createData.carryover_expiry_months} onChange={e=>setCreate('carryover_expiry_months', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Paid</Label><Select value={createData.is_paid ? '1':'0'} onValueChange={v=>setCreate('is_paid', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Kurangi Saldo</Label><Select value={createData.deduct_balance ? '1':'0'} onValueChange={v=>setCreate('deduct_balance', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Half-day</Label><Select value={createData.half_day_allowed ? '1':'0'} onValueChange={v=>setCreate('half_day_allowed', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Prorata Join</Label><Select value={createData.prorate_on_join ? '1':'0'} onValueChange={v=>setCreate('prorate_on_join', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Prorata Resign</Label><Select value={createData.prorate_on_resign ? '1':'0'} onValueChange={v=>setCreate('prorate_on_resign', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Wajib Bukti</Label><Select value={createData.requires_proof ? '1':'0'} onValueChange={v=>setCreate('requires_proof', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
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
            <CardTitle>Daftar Kategori</CardTitle>
            <CardDescription>Total {categories.length} kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Kurangi Saldo</TableHead>
                    <TableHead>Half-day</TableHead>
                    <TableHead>Kuota</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">Belum ada kategori</TableCell></TableRow>
                  ) : categories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.code}</TableCell>
                      <TableCell>{cat.name}</TableCell>
                      <TableCell><Badge variant="outline">{cat.is_paid ? 'Ya':'Tidak'}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{cat.deduct_balance ? 'Ya':'Tidak'}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{cat.half_day_allowed ? 'Ya':'Tidak'}</Badge></TableCell>
                      <TableCell>{cat.base_quota_days ?? '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={()=>openEdit(cat)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={()=>onDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-3xl">
            <form onSubmit={onUpdate}>
              <DialogHeader>
                <DialogTitle>Edit Kategori</DialogTitle>
                <DialogDescription>Perbarui informasi kategori</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2"><Label>Kode</Label><Input value={editData.code} onChange={e=>setEdit('code', e.target.value)} /><InputError message={editErrors.code} /></div>
                <div className="space-y-2"><Label>Nama</Label><Input value={editData.name} onChange={e=>setEdit('name', e.target.value)} /><InputError message={editErrors.name} /></div>
                <div className="space-y-2"><Label>Sifat Hari</Label><Select value={editData.weekend_rule} onValueChange={(v)=>setEdit('weekend_rule', v as 'workdays' | 'calendar')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="workdays">Workdays</SelectItem><SelectItem value="calendar">Calendar days</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Kuota Dasar (hari)</Label><Input type="number" value={editData.base_quota_days} onChange={e=>setEdit('base_quota_days', e.target.value)} /></div>
                <div className="space-y-2"><Label>Carryover Maks</Label><Input type="number" value={editData.carryover_max_days} onChange={e=>setEdit('carryover_max_days', e.target.value)} /></div>
                <div className="space-y-2"><Label>Carryover Expiry (bulan)</Label><Input type="number" value={editData.carryover_expiry_months} onChange={e=>setEdit('carryover_expiry_months', e.target.value)} /></div>
                <div className="space-y-2"><Label>Paid</Label><Select value={editData.is_paid ? '1':'0'} onValueChange={v=>setEdit('is_paid', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Kurangi Saldo</Label><Select value={editData.deduct_balance ? '1':'0'} onValueChange={v=>setEdit('deduct_balance', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Half-day</Label><Select value={editData.half_day_allowed ? '1':'0'} onValueChange={v=>setEdit('half_day_allowed', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Prorata Join</Label><Select value={editData.prorate_on_join ? '1':'0'} onValueChange={v=>setEdit('prorate_on_join', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Prorata Resign</Label><Select value={editData.prorate_on_resign ? '1':'0'} onValueChange={v=>setEdit('prorate_on_resign', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Wajib Bukti</Label><Select value={editData.requires_proof ? '1':'0'} onValueChange={v=>setEdit('requires_proof', v==='1')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Ya</SelectItem><SelectItem value="0">Tidak</SelectItem></SelectContent></Select></div>
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
