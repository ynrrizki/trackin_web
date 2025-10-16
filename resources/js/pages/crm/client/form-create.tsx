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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Klien', href: '/crm/clients' },
    { title: 'Tambah Klien', href: '/crm/clients/create' },
];

export default function ClientCreate() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        industry: '',
        status: 'active',
        notes: '',
    });

    const nameRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        nameRef.current?.focus();
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('crm.clients.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Klien" />

            <div className="mx-auto w-full max-w-[920px] px-4 pt-4 pb-28">
                {/* Back */}
                <div className="mb-4">
                    <Button asChild variant="outline" size="sm">
                        <Link href={route('crm.clients.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle>Formulir Pembuatan Klien</CardTitle>
                        <CardDescription>Isi detail di bawah ini untuk menambahkan klien baru ke sistem.</CardDescription>
                    </CardHeader>

                    <form onSubmit={submit}>
                        <CardContent className="space-y-8">
                            {/* Section: Info Perusahaan */}
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-foreground/90">Informasi Perusahaan</h3>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="code">
                                            Kode <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="code"
                                            placeholder="CLN-2025-001"
                                            required
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                        />
                                        <InputError message={errors.code} />
                                        <p className="text-[11px] text-muted-foreground">Kode unik untuk identifikasi internal.</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="name">
                                            Nama <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            ref={nameRef}
                                            placeholder="PT Sinar Jaya Abadi"
                                            required
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="industry">Industri</Label>
                                        <Input
                                            id="industry"
                                            placeholder="Manufaktur / F&B / Finance"
                                            value={data.industry}
                                            onChange={(e) => setData('industry', e.target.value)}
                                        />
                                        <InputError message={errors.industry} />
                                    </div>

                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label htmlFor="address">Alamat</Label>
                                        <Textarea
                                            id="address"
                                            placeholder="Jln. Mawar No. 8, Jakarta Selatan"
                                            rows={3}
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                        />
                                        <InputError message={errors.address} />
                                    </div>
                                </div>
                            </section>

                            <Separator />

                            {/* Section: Kontak */}
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-foreground/90">Kontak</h3>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="contact_person">Contact Person</Label>
                                        <Input
                                            id="contact_person"
                                            placeholder="Budi Santoso"
                                            value={data.contact_person}
                                            onChange={(e) => setData('contact_person', e.target.value)}
                                        />
                                        <InputError message={errors.contact_person} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="finance@perusahaan.co.id"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            placeholder="+62 812 3456 7890"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                        />
                                        <InputError message={errors.phone} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="status">Status</Label>
                                        <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="suspended">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.status} />
                                    </div>
                                </div>
                            </section>

                            <Separator />

                            {/* Section: Lainnya */}
                            <section className="mb-8">
                                <h3 className="mb-3 text-sm font-semibold text-foreground/90">Lainnya</h3>
                                <div className="space-y-1.5">
                                    <Label htmlFor="notes">Catatan</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Catatan tambahan (opsional)…"
                                        rows={3}
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </section>
                        </CardContent>

                        {/* Sticky actions */}
                        <CardFooter className="sticky bottom-0 z-10 -mb-px flex items-center justify-between gap-3 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <p className="text-[11px] text-muted-foreground">Data klien bersifat rahasia dan hanya untuk keperluan operasional.</p>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('crm.clients.index')}>Batal</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Simpan Klien
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
