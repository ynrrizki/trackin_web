import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, CalendarClock, Copy, Edit3, ExternalLink, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { toast } from 'sonner';

interface ClientDetailProps {
    client: {
        id: number;
        code: string;
        name: string;
        contact_person?: string;
        email?: string;
        phone?: string;
        address?: string;
        industry?: string;
        status: 'active' | 'inactive' | 'suspended';
        notes?: string;
        logo_url?: string;
        created_at?: string;
        updated_at?: string;
    };
}

export default function ClientDetail({ client }: ClientDetailProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Clients', href: '/crm/clients' },
        { title: client.name, href: `/crm/clients/${client.id}` },
    ];

    const statusStyle: Record<string, string> = {
        active: 'bg-emerald-600 text-emerald-50',
        inactive: 'bg-zinc-500 text-zinc-50',
        suspended: 'bg-amber-500 text-amber-50',
    };

    const prettyDate = (d?: string) => (d ? new Date(d).toLocaleString('id-ID') : '-');

    const copy = (text?: string) => {
        if (!text) return;
        navigator?.clipboard?.writeText(text);
        toast.success('Disalin ke clipboard');
    };

    const googleMapsUrl = (addr?: string) => (addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : undefined);

    const initials = client.name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Client: ${client.name}`} />
            <TooltipProvider>
                <div className="mx-auto w-full max-w-[1100px] px-4 py-4 pb-24">
                    {/* Header */}
                    <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14 ring-2 ring-border/50">
                                <AvatarImage
                                    src={
                                        client.logo_url ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=111827&color=fff&size=128`
                                    }
                                    alt={client.name}
                                />
                                <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl leading-tight font-bold">{client.name}</h1>
                                    <Badge className={statusStyle[client.status] || ''}>{client.status}</Badge>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                    <Badge variant="secondary" className="font-mono">
                                        Kode: {client.code}
                                    </Badge>
                                    {client.industry && (
                                        <Badge variant="outline" className="gap-1">
                                            <Building2 className="h-3.5 w-3.5" /> {client.industry}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button asChild>
                                <Link href={route('crm.clients.edit', client.id)}>
                                    <Edit3 className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/crm/clients">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Kembali
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {/* Info utama */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Informasi Kontak</CardTitle>
                                <CardDescription>Detail kontak, alamat, dan informasi umum</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <dl className="divide-y divide-border/60">
                                    {/* Contact person */}
                                    <Row
                                        icon={<UserRound className="h-4 w-4" />}
                                        label="Contact Person"
                                        value={client.contact_person}
                                        actions={
                                            client.contact_person ? (
                                                <IconButton
                                                    icon={<Copy className="h-3.5 w-3.5" />}
                                                    tip="Salin"
                                                    onClick={() => copy(client.contact_person)}
                                                />
                                            ) : null
                                        }
                                    />

                                    {/* Email */}
                                    <Row
                                        icon={<Mail className="h-4 w-4" />}
                                        label="Email"
                                        value={
                                            client.email ? (
                                                <a href={`mailto:${client.email}`} className="underline underline-offset-2 hover:opacity-90">
                                                    {client.email}
                                                </a>
                                            ) : undefined
                                        }
                                        actions={
                                            client.email ? (
                                                <div className="flex gap-1">
                                                    <IconButton
                                                        icon={<Copy className="h-3.5 w-3.5" />}
                                                        tip="Salin"
                                                        onClick={() => copy(client.email)}
                                                    />
                                                    <IconLink
                                                        href={`mailto:${client.email}`}
                                                        icon={<ExternalLink className="h-3.5 w-3.5" />}
                                                        tip="Buka Email"
                                                    />
                                                </div>
                                            ) : null
                                        }
                                    />

                                    {/* Phone */}
                                    <Row
                                        icon={<Phone className="h-4 w-4" />}
                                        label="Phone"
                                        value={
                                            client.phone ? (
                                                <a href={`tel:${client.phone}`} className="underline underline-offset-2 hover:opacity-90">
                                                    {client.phone}
                                                </a>
                                            ) : undefined
                                        }
                                        actions={
                                            client.phone ? (
                                                <div className="flex gap-1">
                                                    <IconButton
                                                        icon={<Copy className="h-3.5 w-3.5" />}
                                                        tip="Salin"
                                                        onClick={() => copy(client.phone)}
                                                    />
                                                    <IconLink
                                                        href={`tel:${client.phone}`}
                                                        icon={<ExternalLink className="h-3.5 w-3.5" />}
                                                        tip="Panggil"
                                                    />
                                                </div>
                                            ) : null
                                        }
                                    />

                                    {/* Address */}
                                    <Row
                                        icon={<MapPin className="h-4 w-4" />}
                                        label="Address"
                                        value={client.address}
                                        actions={
                                            client.address ? (
                                                <div className="flex gap-1">
                                                    <IconButton
                                                        icon={<Copy className="h-3.5 w-3.5" />}
                                                        tip="Salin"
                                                        onClick={() => copy(client.address)}
                                                    />
                                                    <IconLink
                                                        href={googleMapsUrl(client.address)!}
                                                        icon={<ExternalLink className="h-3.5 w-3.5" />}
                                                        tip="Buka di Maps"
                                                    />
                                                </div>
                                            ) : null
                                        }
                                    />

                                    {/* Industry */}
                                    <Row icon={<Building2 className="h-4 w-4" />} label="Industry" value={client.industry} />
                                </dl>
                            </CardContent>
                        </Card>

                        {/* Notes + Meta */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Catatan</CardTitle>
                                    <CardDescription>Informasi tambahan</CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm whitespace-pre-line">
                                    {client.notes?.trim() ? client.notes : <span className="text-muted-foreground">-</span>}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CalendarClock className="h-4 w-4" />
                                        Meta
                                    </CardTitle>
                                    <CardDescription>Jejak waktu pencatatan</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <dl className="space-y-3 text-sm">
                                        <MetaRow label="Dibuat" value={prettyDate(client.created_at)} />
                                        <MetaRow label="Diperbarui" value={prettyDate(client.updated_at)} />
                                    </dl>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        </AppLayout>
    );
}

/* ---------- small presentational helpers ---------- */

function Row({
    icon,
    label,
    value,
    actions,
}: {
    icon?: React.ReactNode;
    label: string;
    value?: React.ReactNode | string;
    actions?: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="mt-0.5 text-muted-foreground">{icon}</div>
            <div className="min-w-[120px] shrink-0 text-xs font-medium text-muted-foreground sm:min-w-[140px]">{label}</div>
            <div className="flex-1 text-sm break-words">{value || <span className="text-muted-foreground">-</span>}</div>
            {actions && <div className="ml-2">{actions}</div>}
        </div>
    );
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="min-w-[120px] shrink-0 text-xs font-medium text-muted-foreground sm:min-w-[140px]">{label}</div>
            <div className="flex-1 text-sm">{value}</div>
        </div>
    );
}

function IconButton({ icon, tip, onClick }: { icon: React.ReactNode; tip: string; onClick?: () => void }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onClick}>
                    {icon}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{tip}</TooltipContent>
        </Tooltip>
    );
}

function IconLink({ href, icon, tip }: { href: string; icon: React.ReactNode; tip: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a href={href} target="_blank" rel="noreferrer">
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                        {icon}
                    </Button>
                </a>
            </TooltipTrigger>
            <TooltipContent>{tip}</TooltipContent>
        </Tooltip>
    );
}
