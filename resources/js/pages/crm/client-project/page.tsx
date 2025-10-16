import { DataTable, type DataTableColumn } from '@/components/data-table';
import { PaginationLinks } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useInertiaSearch } from '@/hooks/use-inertia-search';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit, FilterIcon, Trash2 } from 'lucide-react';

type ClientProjectListItem = {
    id: number;
    code: string;
    name: string;
    status: 'tender' | 'won' | 'lost' | 'cancelled';
    required_agents: number;
    client?: { id: number; name: string } | null;
    outsource_field?: { id: number; name: string } | null;
};

type Paginated<T> = {
    data: T[];
    links?: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
};

interface Masters {
    clients: { id: number; name: string }[];
    outsourcing_fields: { id: number; name: string }[];
}

interface Props {
    data: Paginated<ClientProjectListItem>;
    filters?: { search?: string; status?: string; client_id?: string; outsourcing_field_id?: string };
    masters: Masters;
    stats?: {
        totalProjects: number;
        ongoingProjects: number;
        completedProjects: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Proyek',
        href: route('crm.client-projects.index'),
    },
];

export default function ClientProjectPage({ data }: Props) {
    const { search, setSearch } = useInertiaSearch();

    interface ProjectStats {
        tenderProjects: number;
        wonProjects: number;
        lostProjects: number;
        cancelledProjects: number;
    }

    const projectStats: ProjectStats = {
        tenderProjects: data.data.filter((p) => p.status === 'tender').length,
        wonProjects: data.data.filter((p) => p.status === 'won').length,
        lostProjects: data.data.filter((p) => p.status === 'lost').length,
        cancelledProjects: data.data.filter((p) => p.status === 'cancelled').length,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Projek Klien" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex flex-col items-start gap-2">
                        <h1 className="text-2xl font-semibold">Manajemen Proyek</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola semua proyek klien Anda di sini. Tambah, edit, atau hapus proyek sesuai kebutuhan.
                        </p>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Total Projek</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{data.data.length}</CardTitle>
                                <div className="text-muted-foreground">Jumlah total projek yang terdaftar di sistem.</div>
                            </CardFooter>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Tender Menang</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {projectStats.wonProjects}
                                </CardTitle>
                                <div className="text-muted-foreground">Tender yang berhasil dimenangkan.</div>
                            </CardFooter>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Dalam Tender</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {projectStats.tenderProjects}
                                </CardTitle>
                                <div className="text-muted-foreground">Masih dalam proses tender.</div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
                <div className="flex w-full items-end justify-between">
                    <div></div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            placeholder="Cari projek..."
                            className="w-64"
                            type="search"
                            aria-label="Search projects"
                            // defaultValue={search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button variant="outline" className="">
                            Export Projek
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>Tambah Projek</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>
                                    <Link href={route('crm.client-projects.create')}>Projek Baru</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Bulk Projek</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon">
                                    <FilterIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Filter Projek</DropdownMenuLabel>
                                <DropdownMenuItem>Berdasarkan Status</DropdownMenuItem>
                                <DropdownMenuItem>Berdasarkan Klien</DropdownMenuItem>
                                <DropdownMenuItem>Berdasarkan Bidang</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <ClientProjectsTable data={data.data} />
                {data.links && <PaginationLinks links={data.links} className="mt-10" />}
            </div>
        </AppLayout>
    );
}

function ClientProjectsTable({ data }: { data: ClientProjectListItem[] }) {
    const columns: DataTableColumn<ClientProjectListItem>[] = [
        {
            key: 'code',
            header: 'Kode',
            className: 'w-[110px]',
            cell: (row) => <Badge variant="outline">{row.code}</Badge>,
        },
        { key: 'name', header: 'Nama Projek', accessor: (r) => r.name },
        { key: 'client', header: 'Klien', cell: (r) => r.client?.name || '-' },
        { key: 'outsource_field', header: 'Bidang', cell: (r) => r.outsource_field?.name || '-' },
        { key: 'required_agents', header: 'Kebutuhan Agen', accessor: (r) => r.required_agents },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => {
                const variant: 'default' | 'outline' | 'destructive' | 'secondary' =
                    row.status === 'won' ? 'default' : row.status === 'tender' ? 'outline' : row.status === 'lost' ? 'destructive' : 'secondary';
                const label = row.status === 'tender' ? 'Tender' : row.status === 'won' ? 'Menang' : row.status === 'lost' ? 'Kalah' : 'Dibatalkan';
                return <Badge variant={variant}>{label}</Badge>;
            },
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right w-0',
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Link href={route('crm.client-projects.edit', row.id)}>
                        <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus projek ini?')) {
                                window.location.href = route('crm.client-projects.destroy', row.id);
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DataTable
            data={data}
            columns={columns}
            emptyTitle="Belum ada projek klien"
            emptyDescription="Projek baru akan muncul di sini setelah ditambahkan."
        />
    );
}
