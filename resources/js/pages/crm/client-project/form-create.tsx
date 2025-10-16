import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Masters {
    clients: { id: number; name: string }[];
    outsourcing_fields: { id: number; name: string }[];
}
interface Props {
    masters: Masters;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Projek Klien', href: route('crm.client-projects.index') },
    { title: 'Tambah Projek', href: route('crm.client-projects.create') },
];

export default function ClientProjectCreate({ masters }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        client_id: '',
        outsourcing_field_id: '',
        code: '',
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        latitude: '',
        longitude: '',
        required_agents: 1,
        status: 'tender',
        contract_start: '',
        contract_end: '',
        hourly_rate: '',
        monthly_rate: '',
        special_requirements: '',
        notes: '',
    });

    const nameRef = useRef<HTMLInputElement>(null);
    useEffect(() => nameRef.current?.focus(), []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('crm.client-projects.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Projek" />

            <div className="mx-auto w-full max-w-[1080px] px-4 pt-4 pb-28">
                {/* Back */}
                <div className="mb-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href={route('crm.client-projects.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle>Formulir Pembuatan Projek</CardTitle>
                        <CardDescription>Isi formulir di bawah ini untuk menambahkan projek baru ke sistem.</CardDescription>
                    </CardHeader>

                    <form onSubmit={submit}>
                        <CardContent className="space-y-8">
                            {/* SECTION 1: Identitas Projek */}
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-foreground/90">Identitas Projek</h3>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>
                                            Klien <span className="text-destructive">*</span>
                                        </Label>
                                        <Select value={data.client_id} onValueChange={(v) => setData('client_id', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Klien" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {masters.clients.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.client_id} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Bidang Outsourcing</Label>
                                        <Select
                                            value={data.outsourcing_field_id || undefined}
                                            onValueChange={(v) => setData('outsourcing_field_id', v || '')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Bidang (opsional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {masters.outsourcing_fields.map((f) => (
                                                    <SelectItem key={f.id} value={String(f.id)}>
                                                        {f.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.outsourcing_field_id} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>
                                            Kode <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            placeholder="PRJ-2025-001"
                                            required
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                        />
                                        <InputError message={errors.code} />
                                        <p className="text-[11px] text-muted-foreground">Kode unik projek untuk referensi internal.</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>
                                            Nama <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            ref={nameRef}
                                            placeholder="Pengamanan Kantor Pusat"
                                            required
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Contact Person</Label>
                                        <Input
                                            placeholder="Budi Santoso"
                                            value={data.contact_person}
                                            onChange={(e) => setData('contact_person', e.target.value)}
                                        />
                                        <InputError message={errors.contact_person} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            placeholder="budi@perusahaan.co.id"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Phone</Label>
                                        <Input
                                            placeholder="+62 812 3456 7890"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Status</Label>
                                        <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tender">Tender</SelectItem>
                                                <SelectItem value="won">Menang</SelectItem>
                                                <SelectItem value="lost">Kalah</SelectItem>
                                                <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.status} />
                                    </div>

                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label>Alamat</Label>
                                        <Textarea
                                            placeholder="Jln. Melati No. 10, Jakarta Pusat"
                                            rows={3}
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                        />
                                        <InputError message={errors.address} />
                                    </div>
                                </div>
                            </section>

                            <Separator />

                            {/* SECTION 2: Lokasi & Kontrak */}
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-foreground/90">Lokasi & Kontrak</h3>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>Latitude</Label>
                                        <Input
                                            placeholder="-6.1754"
                                            inputMode="decimal"
                                            value={data.latitude}
                                            onChange={(e) => setData('latitude', e.target.value)}
                                        />
                                        <InputError message={errors.latitude} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Longitude</Label>
                                        <Input
                                            placeholder="106.8272"
                                            inputMode="decimal"
                                            value={data.longitude}
                                            onChange={(e) => setData('longitude', e.target.value)}
                                        />
                                        <InputError message={errors.longitude} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Mulai Kontrak</Label>
                                        <Input type="date" value={data.contract_start} onChange={(e) => setData('contract_start', e.target.value)} />
                                        <InputError message={errors.contract_start} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Akhir Kontrak</Label>
                                        <Input type="date" value={data.contract_end} onChange={(e) => setData('contract_end', e.target.value)} />
                                        <InputError message={errors.contract_end} />
                                    </div>
                                </div>
                            </section>

                            <Separator />

                            {/* SECTION 3: Kebutuhan & Tarif */}
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-foreground/90">Kebutuhan & Tarif</h3>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <Label>Kebutuhan Agen</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={data.required_agents}
                                            onChange={(e) => setData('required_agents', Number(e.target.value || 1))}
                                        />
                                        <InputError message={errors.required_agents} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Tarif per Jam</Label>
                                        <Input
                                            placeholder="50000"
                                            inputMode="numeric"
                                            value={data.hourly_rate}
                                            onChange={(e) => setData('hourly_rate', e.target.value)}
                                        />
                                        <InputError message={errors.hourly_rate} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Tarif Bulanan</Label>
                                        <Input
                                            placeholder="6000000"
                                            inputMode="numeric"
                                            value={data.monthly_rate}
                                            onChange={(e) => setData('monthly_rate', e.target.value)}
                                        />
                                        <InputError message={errors.monthly_rate} />
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 gap-6">
                                    <div className="space-y-1.5">
                                        <Label>Kebutuhan Khusus</Label>
                                        <Textarea
                                            placeholder="Contoh: Seragam khusus, sertifikasi satpam, jadwal malam, dsb."
                                            rows={3}
                                            value={data.special_requirements}
                                            onChange={(e) => setData('special_requirements', e.target.value)}
                                        />
                                        <InputError message={errors.special_requirements} />
                                    </div>
                                </div>
                            </section>

                            <Separator />

                            {/* SECTION 4: Catatan */}
                            <section className="mb-8">
                                <h3 className="mb-3 text-sm font-semibold text-foreground/90">Catatan</h3>
                                <Textarea
                                    placeholder="Catatan tambahan (opsional)…"
                                    rows={3}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                                <InputError message={errors.notes} />
                            </section>
                        </CardContent>

                        {/* Sticky footer actions */}
                        <CardFooter className="sticky bottom-0 z-10 -mb-px flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <p className="text-[11px] text-muted-foreground">Pastikan data sesuai dokumen tender/kontrak.</p>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('crm.client-projects.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Simpan Projek
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
