import { DataTable, type DataTableColumn } from '@/components/data-table';
import { PaginationLinks } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
// import { Checkbox } from '@/components/ui/checkbox';
import { useInertiaSearch } from '@/hooks/use-inertia-search';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, FilterIcon, Trash2 } from 'lucide-react';
// import { useState } from 'react';

type ClientListItem = {
    id: number;
    code: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    industry?: string;
    status: 'active' | 'inactive' | 'suspended';
};

type Paginated<T> = {
    data: T[];
    current_page?: number;
    per_page?: number;
    total?: number;
    links?: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
};

interface ClientPageProps {
    data: Paginated<ClientListItem>;
    filters?: { search?: string; status?: string };
    stats?: {
        totalClients: number;
        activeClients: number;
        inactiveClients: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Klien',
        href: route('crm.clients.index'),
    },
];

export default function ClientPage({ data, stats }: ClientPageProps) {
    const { search, setSearch } = useInertiaSearch();
    // const [selected, setSelected] = useState<number[]>([]);

    const defaultStats = {
        totalClients: data.data.length,
        activeClients: data.data.filter((c) => c.status === 'active').length,
        inactiveClients: data.data.filter((c) => c.status === 'inactive').length,
    };

    const clientStats = stats || defaultStats;

    // const toggleSelect = (id: number) => {
    //     setSelected(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
    // };
    // const allSelected = selected.length === data.data.length && data.data.length > 0;
    // const toggleSelectAll = () => {
    //     setSelected(allSelected ? [] : data.data.map(c => c.id));
    // };

    const columns: DataTableColumn<ClientListItem>[] = [
        // {
        //     key: 'select',
        //     header: (
        //         <Checkbox
        //             checked={allSelected}
        //             onCheckedChange={toggleSelectAll}
        //             aria-label="Select all"
        //         />
        //     ),
        //     className: 'w-8',
        //     cell: (row) => (
        //         <Checkbox
        //             checked={selected.includes(row.id)}
        //             onCheckedChange={() => toggleSelect(row.id)}
        //             aria-label={`Select ${row.name}`}
        //         />
        //     ),
        // },
        {
            key: 'code',
            header: 'Kode',
            className: 'w-[110px]',
            cell: (row) => <Badge variant="outline">{row.code}</Badge>,
        },
        { key: 'name', header: 'Nama', accessor: (r) => r.name },
        { key: 'contact_person', header: 'Contact Person', accessor: (r) => r.contact_person || '-' },
        { key: 'email', header: 'Email', accessor: (r) => r.email || '-' },
        { key: 'industry', header: 'Industri', accessor: (r) => r.industry || '-' },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>{row.status}</Badge>,
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right w-0',
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Link href={route('crm.clients.show', row.id)}>
                        <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={route('crm.clients.edit', row.id)}>
                        <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus klien ini?')) {
                                router.delete(route('crm.clients.destroy', row.id));
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Klien" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex flex-col items-start gap-2">
                        <h1 className="text-2xl font-semibold">Manajemen Klien</h1>
                        <p className="text-sm text-muted-foreground">Kelola data klien, termasuk penambahan, pengeditan, dan penghapusan.</p>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Total Klien</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {clientStats.totalClients}
                                </CardTitle>
                                <div className="text-muted-foreground">Jumlah total klien yang terdaftar di sistem.</div>
                            </CardFooter>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Klien Aktif</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {clientStats.activeClients}
                                </CardTitle>
                                <div className="text-muted-foreground">Klien yang aktif bekerja sama dengan perusahaan.</div>
                            </CardFooter>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Klien Tidak Aktif</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {clientStats.inactiveClients}
                                </CardTitle>
                                <div className="text-muted-foreground">Klien yang tidak aktif atau suspended.</div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
                <div className="flex w-full items-end justify-between">
                    <div></div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            placeholder="Cari klien..."
                            className="w-64"
                            type="search"
                            aria-label="Search clients"
                            // defaultValue={search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button variant="outline" className="">
                            Export Klien
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>Tambah Klien</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>
                                    <Link href={route('crm.clients.create')}>Klien Baru</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Bulk Klien</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon">
                                    <FilterIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Filter Klien</DropdownMenuLabel>
                                <DropdownMenuItem>Berdasarkan Status</DropdownMenuItem>
                                <DropdownMenuItem>Berdasarkan Industri</DropdownMenuItem>
                                <DropdownMenuItem>Berdasarkan Tanggal Bergabung</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <DataTable
                    data={data.data}
                    columns={columns}
                    emptyTitle="Belum ada klien"
                    emptyDescription="Klien baru akan muncul di sini setelah ditambahkan."
                />
                {data.links && <PaginationLinks links={data.links} className="mt-10" />}
            </div>
        </AppLayout>
    );
}
