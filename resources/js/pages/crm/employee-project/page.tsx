// import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, Eye, Plus, Trash2, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';

interface EmployeeProject {
    id: number;
    employee: {
        id: number;
        employee_code: string;
        full_name: string;
        position?: { name: string };
        level?: { name: string };
        department?: { name: string };
        outsource_field?: { name: string };
    };
    project: {
        id: number;
        code: string;
        name: string;
        // status: string;
        client: {
            name: string;
        };
    };
    created_at: string;
}

interface Props {
    employeeProjects: {
        data: EmployeeProject[];
        links: { label: string; url: string | null; active: boolean }[];
        meta: { from: number; to: number; total: number };
    };
    filters: {
        search?: string;
        project_id?: string;
        outsourcing_field_id?: string;
    };
    statistics: {
        total_assignments: number;
        active_projects: number;
        tender_projects: number;
        unique_employees: number;
    };
    masters: {
        projects: { id: number; name: string; code: string }[];
        outsourcing_fields: { id: number; name: string }[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Penugasan Karyawan',
        href: route('crm.employee-projects.index'),
    },
];

export default function EmployeeProjectIndex({ employeeProjects, filters, statistics, masters }: Props) {
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const [projectFilter, setProjectFilter] = useState(filters.project_id || '');
    const [outsourcingFieldFilter, setOutsourcingFieldFilter] = useState(filters.outsourcing_field_id || '');

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            router.get(
                route('crm.employee-projects.index'),
                { ...filters, search: searchTerm || undefined },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        }
    };

    const handleFilterChange = (type: string, value: string) => {
        const newFilters = { ...filters, [type]: value || undefined };
        if (type === 'project_id') setProjectFilter(value);
        if (type === 'outsourcing_field_id') setOutsourcingFieldFilter(value);

        router.get(route('crm.employee-projects.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSelectAll = () => {
        if (selectedItems.length === employeeProjects.data.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(employeeProjects.data.map((item) => item.id));
        }
    };

    const handleSelectItem = (id: number) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter((item) => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const isAllSelected = selectedItems.length === employeeProjects.data.length && employeeProjects.data.length > 0;
    const hasSelectedItems = selectedItems.length > 0;

    const handleBulkDelete = () => {
        if (!hasSelectedItems) return;

        if (confirm(`Apakah Anda yakin ingin menghapus ${selectedItems.length} penugasan karyawan?`)) {
            router.delete(route('crm.employee-projects.bulk-destroy'), {
                data: { ids: selectedItems },
                preserveScroll: true,
            });
        }
    };

    // const getStatusBadge = (status: string) => {
    //     const variants = {
    //         tender: 'outline',
    //         won: 'default',
    //         lost: 'destructive',
    //         cancelled: 'secondary',
    //     } as const;

    //     const labels = {
    //         tender: 'Tender',
    //         won: 'Menang',
    //         lost: 'Kalah',
    //         cancelled: 'Dibatalkan',
    //     };

    //     return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{labels[status as keyof typeof labels] || status}</Badge>;
    // };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Penugasan Karyawan" />

            <div className="flex h-full flex-1 flex-col space-y-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Penugasan Karyawan</h1>
                    <p className="text-muted-foreground">Kelola penugasan karyawan ke projek klien</p>
                </div>

                {/* Statistics Cards */}
                <div className="bg-card-gradient grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Penugasan</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_assignments}</div>
                            <p className="text-xs text-muted-foreground">Seluruh penugasan karyawan</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Projek Aktif</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.active_projects}</div>
                            <p className="text-xs text-muted-foreground">Tender yang sudah menang</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Projek Tender</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.tender_projects}</div>
                            <p className="text-xs text-muted-foreground">Masih dalam tahap tender</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Karyawan Unik</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.unique_employees}</div>
                            <p className="text-xs text-muted-foreground">Karyawan yang ditugaskan</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Header Actions */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
                    <div className="flex gap-2">
                        {hasSelectedItems && (
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus ({selectedItems.length})
                            </Button>
                        )}
                        <Button asChild>
                            <Link href={route('crm.employee-projects.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tugaskan Karyawan
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter & Pencarian</CardTitle>
                        <CardDescription>Gunakan filter di bawah untuk mempersempit hasil pencarian</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Pencarian</label>
                                <Input
                                    placeholder="Cari karyawan atau projek..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearch}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Projek</label>
                                <Select value={projectFilter || undefined} onValueChange={(value) => handleFilterChange('project_id', value || '')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Projek" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {masters.projects.map((project) => (
                                            <SelectItem key={project.id} value={project.id.toString()}>
                                                {project.code} - {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bidang Outsourcing</label>
                                <Select
                                    value={outsourcingFieldFilter || undefined}
                                    onValueChange={(value) => handleFilterChange('outsourcing_field_id', value || '')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Bidang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {masters.outsourcing_fields.map((field) => (
                                            <SelectItem key={field.id} value={field.id.toString()}>
                                                {field.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Table */}
                <EmployeeProjectsTable
                    data={employeeProjects.data}
                    selected={selectedItems}
                    onToggleSelect={handleSelectItem}
                    onToggleSelectAll={handleSelectAll}
                    allSelected={isAllSelected}
                />

                {/* Pagination */}
                {employeeProjects.links && employeeProjects.meta && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan {employeeProjects.meta.from || 0}-{employeeProjects.meta.to || 0} dari {employeeProjects.meta.total || 0} data
                        </div>
                        <div className="flex gap-2">
                            {employeeProjects.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

interface EmployeeProjectsTableProps {
    data: EmployeeProject[];
    selected: number[];
    onToggleSelect: (id: number) => void;
    onToggleSelectAll: () => void;
    allSelected: boolean;
}

function EmployeeProjectsTable({ data, selected, onToggleSelect, onToggleSelectAll, allSelected }: EmployeeProjectsTableProps) {
    const columns: DataTableColumn<EmployeeProject>[] = [
        {
            key: 'select',
            header: <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} aria-label="Select all assignments" />,
            className: 'w-8',
            cell: (row) => (
                <Checkbox
                    checked={selected.includes(row.id)}
                    onCheckedChange={() => onToggleSelect(row.id)}
                    aria-label={`Select assignment ${row.id}`}
                />
            ),
        },
        {
            key: 'employee',
            header: 'Karyawan',
            cell: (row) => (
                <div>
                    <div className="font-medium">{row.employee.full_name}</div>
                    <div className="text-xs text-muted-foreground">{row.employee.employee_code}</div>
                </div>
            ),
        },
        {
            key: 'position',
            header: 'Posisi',
            cell: (row) => (
                <div>
                    <div className="font-medium">{row.employee.position?.name || '-'}</div>
                    <div className="text-xs text-muted-foreground">{row.employee.level?.name || '-'}</div>
                </div>
            ),
        },
        { key: 'field', header: 'Bidang', cell: (r) => r.employee.outsource_field?.name || '-' },
        {
            key: 'project',
            header: 'Projek',
            cell: (row) => (
                <div>
                    <div className="font-medium">{row.project.name}</div>
                    <div className="text-xs text-muted-foreground">{row.project.code}</div>
                </div>
            ),
        },
        { key: 'client', header: 'Klien', cell: (r) => r.project.client.name },
        {
            key: 'assigned_at',
            header: 'Tanggal Ditugaskan',
            cell: (row) => new Date(row.created_at).toLocaleDateString('id-ID'),
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right w-0',
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('crm.employee-projects.show', row.id)}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus penugasan ini?')) {
                                router.delete(route('crm.employee-projects.destroy', row.id));
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
            emptyTitle="Belum ada penugasan"
            emptyDescription="Penugasan karyawan akan muncul di sini setelah dibuat."
        />
    );
}
