import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, CalendarClock, Copy, ExternalLink, Mail, MapPin, Phone, Trash2, User, Users } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
interface EmployeeProject {
    id: number;
    employee: {
        id: number;
        employee_code: string;
        full_name: string;
        email: string;
        phone: string;
        position?: { name: string };
        level?: { name: string };
        department?: { name: string };
        outsource_field?: { name: string };
        photo_url?: string | null;
    };
    project: {
        id: number;
        code: string;
        name: string;
        status: 'tender' | 'won' | 'lost' | 'cancelled' | string;
        contact_person: string;
        email: string;
        phone: string;
        address: string;
        required_agents: number;
        contract_start: string;
        contract_end: string;
        client: {
            id?: number;
            name: string;
            logo_url?: string | null;
        };
    };
    created_at: string;
    updated_at: string;
}

interface Props {
    employeeProject: EmployeeProject;
}

export default function EmployeeProjectDetail({ employeeProject }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: route('dashboard'),
        },
        {
            title: 'Penugasan Karyawan',
            href: route('crm.employee-projects.index'),
        },
        {
            title: `${employeeProject.employee.full_name} - ${employeeProject.project.name}`,
            href: route('crm.employee-projects.show', employeeProject.id),
            // href: `/crm/employee-projects/${employeeProject.id}`,
        },
    ];

    const statusUI = {
        tender: { variant: 'outline' as const, label: 'Tender' },
        won: { variant: 'default' as const, label: 'Menang' },
        lost: { variant: 'destructive' as const, label: 'Kalah' },
        cancelled: { variant: 'secondary' as const, label: 'Dibatalkan' },
    };

    const statusBadge = (s: EmployeeProject['project']['status']) => {
        const ui = (
            statusUI as {
                [key: string]: { variant: React.ComponentProps<typeof Badge>['variant']; label: string };
            }
        )[s] ?? { variant: 'outline', label: s };
        return <Badge variant={ui.variant}>{ui.label}</Badge>;
    };

    const humanDate = (d?: string) => (d ? new Date(d).toLocaleDateString('id-ID') : '-');
    const humanDateTime = (d?: string) => (d ? new Date(d).toLocaleString('id-ID') : '-');

    const mapsUrl = (addr?: string) => (addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : '#');

    const empInitials = useMemo(
        () =>
            employeeProject.employee.full_name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase(),
        [employeeProject.employee.full_name],
    );

    const clientInitials = useMemo(
        () =>
            employeeProject.project.client.name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase(),
        [employeeProject.project.client.name],
    );

    const handleDelete = () => {
        if (confirm('Apakah Anda yakin ingin menghapus penugasan ini?')) {
            router.delete(route('crm.employee-projects.destroy', employeeProject.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Penugasan: ${employeeProject.employee.full_name} - ${employeeProject.project.name}`} />
            <TooltipProvider>
                <div className="mx-auto w-full max-w-[1100px] px-4 py-4 pb-24">
                    {/* HERO */}
                    <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 ring-2 ring-border/50">
                                <AvatarImage
                                    src={
                                        employeeProject.employee.photo_url ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeProject.employee.full_name)}&size=128&background=111827&color=fff`
                                    }
                                    alt={employeeProject.employee.full_name}
                                />
                                <AvatarFallback>{empInitials}</AvatarFallback>
                            </Avatar>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="truncate text-2xl leading-tight font-bold">Detail Penugasan</h1>
                                    {statusBadge(employeeProject.project.status)}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {employeeProject.employee.full_name} → {employeeProject.project.name}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus Penugasan
                            </Button>
                            <Button asChild variant="outline">
                                <Link href={route('crm.employee-projects.index')}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Kembali
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* SUMMARY */}
                    <div className="mb-1 grid gap-4 md:grid-cols-3">
                        <SummaryCard
                            title="Status Projek"
                            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
                            value={statusBadge(employeeProject.project.status)}
                        />
                        <SummaryCard
                            title="Tanggal Penugasan"
                            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                            value={<div className="text-xl font-semibold">{humanDate(employeeProject.created_at)}</div>}
                        />
                        <SummaryCard
                            title="Bidang Tugas"
                            icon={<Users className="h-4 w-4 text-muted-foreground" />}
                            value={
                                <div className="text-base font-medium">{employeeProject.employee.outsource_field?.name || 'Tidak ditentukan'}</div>
                            }
                        />
                    </div>

                    {/* TWO COLUMNS */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* KARYAWAN */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informasi Karyawan
                                </CardTitle>
                                <CardDescription>Detail lengkap karyawan yang ditugaskan</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <dl className="divide-y divide-border/60">
                                    <Row label="Nama Lengkap" value={employeeProject.employee.full_name} />
                                    <Row label="Kode Karyawan" value={<span className="font-mono">{employeeProject.employee.employee_code}</span>} />
                                    <Row label="Posisi" value={employeeProject.employee.position?.name || '-'} />
                                    <Row label="Level" value={employeeProject.employee.level?.name || '-'} />
                                    <Row label="Departemen" value={employeeProject.employee.department?.name || '-'} />
                                    <Row
                                        icon={<Mail className="h-4 w-4" />}
                                        label="Email"
                                        value={
                                            employeeProject.employee.email ? (
                                                <a className="underline underline-offset-2" href={`mailto:${employeeProject.employee.email}`}>
                                                    {employeeProject.employee.email}
                                                </a>
                                            ) : undefined
                                        }
                                        actions={
                                            employeeProject.employee.email ? (
                                                <Actions
                                                    copyValue={employeeProject.employee.email}
                                                    openHref={`mailto:${employeeProject.employee.email}`}
                                                    openTip="Buka Email"
                                                />
                                            ) : null
                                        }
                                    />
                                    <Row
                                        icon={<Phone className="h-4 w-4" />}
                                        label="Telepon"
                                        value={
                                            employeeProject.employee.phone ? (
                                                <a className="underline underline-offset-2" href={`tel:${employeeProject.employee.phone}`}>
                                                    {employeeProject.employee.phone}
                                                </a>
                                            ) : undefined
                                        }
                                        actions={
                                            employeeProject.employee.phone ? (
                                                <Actions
                                                    copyValue={employeeProject.employee.phone}
                                                    openHref={`tel:${employeeProject.employee.phone}`}
                                                    openTip="Panggil"
                                                />
                                            ) : null
                                        }
                                    />
                                </dl>
                            </CardContent>
                        </Card>

                        {/* PROJEK */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Informasi Projek
                                </CardTitle>
                                <CardDescription>Detail lengkap projek penugasan</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex items-center gap-3">
                                    <Avatar className="h-10 w-10 ring-2 ring-border/50">
                                        <AvatarImage
                                            src={
                                                employeeProject.project.client.logo_url ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeProject.project.client.name)}&size=128&background=0B1220&color=fff`
                                            }
                                        />
                                        <AvatarFallback className="text-xs font-semibold">{clientInitials}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="truncate font-semibold">{employeeProject.project.client.name}</div>
                                        <div className="text-xs text-muted-foreground">Klien</div>
                                    </div>
                                </div>

                                <dl className="divide-y divide-border/60">
                                    <Row label="Nama Projek" value={employeeProject.project.name} />
                                    <Row label="Kode Projek" value={<span className="font-mono">{employeeProject.project.code}</span>} />
                                    <Row label="Status" value={statusBadge(employeeProject.project.status)} />
                                    <Row label="Kebutuhan Agen" value={`${employeeProject.project.required_agents} orang`} />
                                    <Row label="Contact Person" value={employeeProject.project.contact_person || '-'} />
                                    <Row
                                        label="Periode Kontrak"
                                        value={
                                            employeeProject.project.contract_start
                                                ? `${humanDate(employeeProject.project.contract_start)} — ${
                                                      employeeProject.project.contract_end
                                                          ? humanDate(employeeProject.project.contract_end)
                                                          : 'Ongoing'
                                                  }`
                                                : 'Belum ditentukan'
                                        }
                                    />
                                    <Row
                                        icon={<Mail className="h-4 w-4" />}
                                        label="Email"
                                        value={
                                            employeeProject.project.email ? (
                                                <a className="underline underline-offset-2" href={`mailto:${employeeProject.project.email}`}>
                                                    {employeeProject.project.email}
                                                </a>
                                            ) : undefined
                                        }
                                        actions={
                                            employeeProject.project.email ? (
                                                <Actions
                                                    copyValue={employeeProject.project.email}
                                                    openHref={`mailto:${employeeProject.project.email}`}
                                                    openTip="Buka Email"
                                                />
                                            ) : null
                                        }
                                    />
                                    <Row
                                        icon={<Phone className="h-4 w-4" />}
                                        label="Telepon"
                                        value={
                                            employeeProject.project.phone ? (
                                                <a className="underline underline-offset-2" href={`tel:${employeeProject.project.phone}`}>
                                                    {employeeProject.project.phone}
                                                </a>
                                            ) : undefined
                                        }
                                        actions={
                                            employeeProject.project.phone ? (
                                                <Actions
                                                    copyValue={employeeProject.project.phone}
                                                    openHref={`tel:${employeeProject.project.phone}`}
                                                    openTip="Panggil"
                                                />
                                            ) : null
                                        }
                                    />
                                    <Row
                                        icon={<MapPin className="h-4 w-4" />}
                                        label="Alamat"
                                        value={<span className="whitespace-pre-line">{employeeProject.project.address || '-'}</span>}
                                        actions={
                                            employeeProject.project.address ? (
                                                <Actions
                                                    copyValue={employeeProject.project.address}
                                                    openHref={mapsUrl(employeeProject.project.address)}
                                                    openTip="Buka di Maps"
                                                />
                                            ) : null
                                        }
                                    />
                                </dl>

                                {/* Meta kecil */}
                                <div className="mt-6 rounded-lg border p-3">
                                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                                        <CalendarClock className="h-4 w-4" /> Meta
                                    </div>
                                    <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                        <MetaRow label="Ditambahkan" value={humanDateTime(employeeProject.created_at)} />
                                        <MetaRow label="Diperbarui" value={humanDateTime(employeeProject.updated_at)} />
                                    </dl>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sticky footer actions */}
                    <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-center gap-2 border-t bg-background/80 px-2 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <Button variant="outline" asChild>
                            {/* NOTE: tetap pakai rute yang kamu gunakan sebelumnya; kalau punya client.id, ganti dengan id */}
                            <Link href={route('crm.clients.show', employeeProject.project.client)}>
                                <Building2 className="mr-2 h-4 w-4" />
                                Lihat Detail Klien
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={route('crm.employee-projects.create', { project_id: employeeProject.project.id })}>
                                <Users className="mr-2 h-4 w-4" />
                                Tugaskan Karyawan Lain
                            </Link>
                        </Button>
                    </div>
                </div>
            </TooltipProvider>
        </AppLayout>
    );
}

/* ---------- mini components ---------- */

function SummaryCard({ title, icon, value }: { title: string; icon?: React.ReactNode; value: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>{value}</CardContent>
        </Card>
    );
}

function Row({
    label,
    value,
    icon,
    actions,
}: {
    label: string;
    value?: React.ReactNode | string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-[20px,160px,minmax(0,1fr),auto] items-start gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[20px,180px,minmax(0,1fr),auto]">
            {/* icon */}
            <div className="mt-0.5 text-muted-foreground">{icon}</div>

            {/* label */}
            <div className="text-xs font-medium text-muted-foreground">{label}</div>

            {/* value */}
            <div className="min-w-0 text-sm break-words">{value ?? <span className="text-muted-foreground">-</span>}</div>

            {/* actions */}
            {actions ? <div className="ml-1 flex-none">{actions}</div> : <div />}
        </div>
    );
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid grid-cols-[140px,minmax(0,1fr)] items-start gap-x-3">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="min-w-0 text-sm tabular-nums">{value}</div>
        </div>
    );
}

async function copyText(text?: string) {
    if (!text) return;
    try {
        // Pakai Clipboard API hanya di secure context (https/localhost)
        if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback untuk http / 192.168.x.x / browser lama
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            ta.style.pointerEvents = 'none';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        toast.success('Disalin ke clipboard');
    } catch (err) {
        console.error('Copy failed:', err);
        toast.error('Gagal menyalin');
    }
}

function Actions({ copyValue, openHref, openTip }: { copyValue: string; openHref?: string; openTip?: string }) {
    return (
        <div className="flex gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Salin" onClick={() => copyText(copyValue)}>
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Salin</TooltipContent>
            </Tooltip>
            {openHref && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <a href={openHref} target="_blank" rel="noreferrer" aria-label={openTip || 'Buka'}>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                        </a>
                    </TooltipTrigger>
                    <TooltipContent>{openTip || 'Buka'}</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}
