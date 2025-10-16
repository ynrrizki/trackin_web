import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';

interface Patroli {
    id: number;
    start_time: string;
    end_time: string;
    status: string;
    note?: string;
    project?: { id: number; name: string };
    checkpoint?: { id: number; name: string };
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}
interface PaginationMeta {
    current_page: number;
    from: number | null;
    to: number | null;
    total: number;
    last_page: number;
    per_page: number;
}
interface PatroliPagination {
    data: Patroli[];
    meta: PaginationMeta;
    links: PaginationLink[];
}
interface Props {
    patrols: PatroliPagination;
    projects: { id: number; name: string }[];
    filters: { project_id?: string; employee_id?: string; date?: string };
}

export default function PatroliPage({ patrols, projects, filters }: Props) {
    const handleFilter = (key: string, value: string) => {
        const newFilters: Record<string, string> = { ...(filters as Record<string, string>) };
        if (value) newFilters[key] = value;
        else delete newFilters[key];
        router.get('/security-ops/patroli', newFilters, { replace: true, preserveState: true });
    };

    const columns: DataTableColumn<Patroli>[] = [
        { key: 'id', header: 'ID', accessor: (p) => p.id },
        {
            key: 'waktu',
            header: 'Waktu',
            cell: (p) => (
                <span className="text-sm">
                    {p.start_time} - {p.end_time}
                </span>
            ),
        },
        { key: 'project', header: 'Project', accessor: (p) => p.project?.name || '-' },
        { key: 'checkpoint', header: 'Checkpoint', accessor: (p) => p.checkpoint?.name || '-' },
        { key: 'status', header: 'Status', cell: (p) => <Badge variant="outline">{p.status}</Badge> },
        {
            key: 'aksi',
            header: '',
            align: 'right',
            cell: (p) => (
                <Link href={`/security-ops/patroli/${p.id}`}>
                    <Button size="sm" variant="outline">
                        Detail
                    </Button>
                </Link>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Patroli', href: '/security-ops/patroli' }]}>
            <Head title="Patroli" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Page Header */}
                <div className="flex flex-col items-start gap-2">
                    <h1 className="text-2xl font-semibold">Manajemen Patroli</h1>
                    <p className="text-sm text-muted-foreground max-w-2xl">Pantau dan kelola aktivitas patroli, filter berdasarkan proyek dan tanggal untuk menelusuri riwayat pelaksanaan.</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Project</label>
                        <Select value={filters.project_id ?? 'all'} onValueChange={(v) => handleFilter('project_id', v === 'all' ? '' : v)}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Semua" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Tanggal</label>
                        <Input type="date" value={filters.date || ''} onChange={(e) => handleFilter('date', e.target.value)} />
                    </div>
                    <Link href="/security-ops/projects" className="ml-auto">
                        <Button variant="outline">Kelola Checkpoints</Button>
                    </Link>
                </div>

                {/* Table (no card) */}
                <DataTable
                    data={patrols.data}
                    columns={columns}
                    emptyIcon={ClipboardList}
                    emptyTitle="Belum ada patroli"
                    emptyDescription="Patroli yang dibuat akan muncul di sini. Ubah filter atau tambahkan data baru."
                />
            </div>
        </AppLayout>
    );
}
