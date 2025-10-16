import { DataTable, type DataTableColumn } from '@/components/data-table';
import { TransferSheet } from '@/components/hrms/transfer-sheet';
import { PaginationLinks } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInertiaSearch } from '@/hooks/use-inertia-search';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, getInitials, getStatusBadge } from '@/lib/utils';
import employeeService from '@/services/employeeService';
import { Employee, Pagination, type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Download, Edit, FilterIcon, GitMerge, LogOut, MoreHorizontal, Trash2, Users2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
    },
    {
        title: 'Karyawan',
        href: route('hrms.employees.index'),
    },
];

interface FilterOptions {
    departments: Array<{ id: number; name: string }>;
    positions: Array<{ id: number; name: string }>;
    positionLevels: Array<{ id: number; name: string }>;
    employeeTypes: Array<{ id: number; name: string }>;
    employmentStatuses: Array<{ id: number; name: string }>;
    outsourcingFields: Array<{ id: number; name: string }>;
    statuses: Array<{ value: string; label: string }>;
    categories: Array<{ value: string; label: string }>;
}

interface Filters {
    search?: string;
    department_id?: string;
    position_id?: string;
    level_id?: string;
    employee_type_id?: string;
    employment_status_id?: string;
    status?: string;
    category?: string;
    outsourcing_field_id?: string;
    join_date_from?: string;
    join_date_to?: string;
    salary_from?: string;
    salary_to?: string;
}

export default function EmployeePage({
    data,
    stats,
    filterOptions,
    filters,
}: {
    data: Pagination<Employee>;
    stats: {
        totalEmployees: number;
        activeEmployees: number;
        leaveEmployees: number;
        internalEmployees: number;
        outsourcingEmployees: number;
    };
    filterOptions: FilterOptions;
    filters: Filters;
}) {
    const { search, setSearch } = useInertiaSearch();

    // Filter state
    const [showFilters, setShowFilters] = useState(false);

    // Filter handlers
    const handleFilterChange = (key: string, value: string) => {
        const currentFilters = { ...filters };
        if (value === '' || value === 'all') {
            delete currentFilters[key as keyof Filters];
        } else {
            currentFilters[key as keyof Filters] = value;
        }

        router.get(route('hrms.employees.index'), currentFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearAllFilters = () => {
        router.get(
            route('hrms.employees.index'),
            {},
            {
                preserveState: false,
            },
        );
    };

    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some((value) => value && value !== '');

    // Count active filters
    const activeFilterCount = Object.values(filters).filter((value) => value && value !== '').length;

    // Export function
    const handleExport = async () => {
        // const params = new URLSearchParams();

        // // Add current search parameter
        // if (search) {
        //     params.append('search', search);
        // }

        // // Create export URL
        // const exportUrl = route('hrms.employees.export') + (params.toString() ? '?' + params.toString() : '');

        // // Open in new tab to download
        // window.open(exportUrl, '_blank');
        try {
            const response = await employeeService.exportEmployees({
                params: search ? { search } : {},
            });
            const name = 'export_employee_' + new Date().toISOString().slice(0, 10) + '.xlsx';
            // Create a blob from the response
            employeeService.downloadBlob(response, name);

            toast.success('Employee data exported successfully');
        } catch {
            toast.error('Failed to export employee data');
        }
    };
    const isMobile = useIsMobile();

    // Delete and Resign dialogs state
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; employee: Employee | null }>({
        open: false,
        employee: null,
    });
    const [resignDialog, setResignDialog] = useState<{
        open: boolean;
        employee: Employee | null;
        reason: string;
        date: string;
        loading: boolean;
    }>({
        open: false,
        employee: null,
        reason: '',
        date: new Date().toISOString().split('T')[0],
        loading: false,
    });

    // Delete employee function
    const handleDeleteEmployee = async () => {
        if (!deleteDialog.employee) return;

        try {
            router.delete(route('employees.destroy', deleteDialog.employee.id), {
                onSuccess: () => {
                    setDeleteDialog({ open: false, employee: null });
                },
                onError: (errors) => {
                    console.error('Delete failed:', errors);
                },
            });
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // Resign employee function
    const handleResignEmployee = async () => {
        if (!resignDialog.employee) return;

        setResignDialog((prev) => ({ ...prev, loading: true }));

        try {
            router.patch(
                route('employees.resign', resignDialog.employee.id),
                {
                    resignation_reason: resignDialog.reason,
                    resignation_date: resignDialog.date,
                },
                {
                    onSuccess: () => {
                        setResignDialog({
                            open: false,
                            employee: null,
                            reason: '',
                            date: new Date().toISOString().split('T')[0],
                            loading: false,
                        });
                    },
                    onError: (errors) => {
                        console.error('Resign failed:', errors);
                        setResignDialog((prev) => ({ ...prev, loading: false }));
                    },
                },
            );
        } catch (error) {
            console.error('Resign error:', error);
            setResignDialog((prev) => ({ ...prev, loading: false }));
        }
    };
    // Transfer sheet state
    const [openTransfer, setOpenTransfer] = useState(false);
    const [transferEmployee, setTransferEmployee] = useState<Employee | null>(null);
    const [historyView, setHistoryView] = useState(false); // sheet internal mode flag
    const resetForm = () => {}; // kept for compatibility with prior logic

    // Column visibility state (default visible core columns)
    const [visible, setVisible] = useState<string[]>(['phone', 'status', 'join_date', 'employment_status', 'employee_type']);

    const toggleColumn = (key: string) => {
        setVisible((v) => (v.includes(key) ? v.filter((k) => k !== key) : [...v, key]));
    };

    // Sticky + merged base columns
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const [scrolledLeft, setScrolledLeft] = useState(false);

    const handleScroll = () => {
        const el = scrollContainerRef.current;
        if (!el) return;
        const {
            scrollLeft,
            // scrollWidth, clientWidth
        } = el;
        setScrolledLeft(scrollLeft > 0);
    };

    useEffect(() => {
        handleScroll();
    }, []);

    const stickyShadowLeft = scrolledLeft ? 'shadow-[inset_6px_0_6px_-6px_rgba(0,0,0,0.4)]' : '';

    const baseColumns: DataTableColumn<Employee>[] = useMemo(
        () => [
            {
                key: 'identity',
                header: (
                    <div className="flex items-center gap-2">
                        <span>Karyawan</span>
                    </div>
                ),
                className: `min-w-[320px] md:sticky left-0 bg-background/95 z-10 ${isMobile ? '' : stickyShadowLeft}`,
                cell: (e) => (
                    <div className="flex items-start gap-3">
                        {e.photo_url ? (
                            <img src={e.photo_url} alt={e.full_name} className="h-9 w-9 rounded-full border object-cover" />
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-primary/10 text-xs font-medium text-primary">
                                {getInitials(e.full_name)}
                            </div>
                        )}
                        <div className="flex min-w-0 flex-col gap-0.5">
                            <div className="flex min-w-0 items-center gap-2">
                                {/* <span className="max-w-[140px] truncate font-medium">{e.full_name}</span> */}
                                <span className="max-w-full truncate font-medium">{e.full_name}</span>
                            </div>
                            <div
                                className="flex min-w-0 items-center gap-2"
                            >
                                <Badge variant="outline" className="px-1 py-0 font-mono text-base leading-5">
                                    {e.employee_code}
                                </Badge>
                                <span className="truncate text-base text-muted-foreground">{e.email}</span>
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                key: 'position',
                header: 'Posisi',
                // className: `min-w-[170px] sticky left-[320px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 z-10 border-r border-border ${stickyShadowLeft}`,
                cell: (e) => (
                    <div className="flex flex-col text-sm">
                        <span className="truncate">{e?.position?.name ?? '-'}</span>
                        <span className="truncate text-xs text-muted-foreground">{e?.position_level?.name ?? '-'}</span>
                    </div>
                ),
            },
            {
                key: 'dept_field',
                header: 'Department / Outsourcing Field',
                // className: `min-w-[230px] sticky left-[490px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 z-10 border-r border-border ${stickyShadowLeft}`,
                cell: (e) => (
                    <div className="flex flex-col text-sm">
                        <span className="truncate">{e?.department?.name ?? e?.outsource_field?.name ?? '-'}</span>
                    </div>
                ),
            },
        ],
        [stickyShadowLeft, isMobile],
    );

    const optionalColumns: DataTableColumn<Employee>[] = useMemo(
        () => [
            {
                key: 'employment_status',
                header: 'Status Kerja',
                cell: (e) => e.employment_status?.name || '-',
            },
            {
                key: 'employee_type',
                header: 'Tipe',
                cell: (e) =>
                    e.employee_type?.name ? (
                        <Badge variant={e.employee_type.name.toLowerCase() === 'internal' ? 'default' : 'secondary'} className="capitalize">
                            {e.employee_type.name}
                        </Badge>
                    ) : (
                        <Badge variant="outline">-</Badge>
                    ),
            },
            { key: 'phone', header: 'Telepon', accessor: (e) => e.phone || '-' },
            { key: 'join_date', header: 'Join', accessor: (e) => e.join_date || '-' },
            { key: 'birth_date', header: 'Lahir', accessor: (e) => e.birth_date || '-' },
            { key: 'religion', header: 'Agama', accessor: (e) => e.religion || '-' },
            { key: 'marital_status', header: 'Status Nikah', accessor: (e) => e.marital_status || '-' },
            { key: 'last_education', header: 'Pendidikan', accessor: (e) => e.last_education || '-' },
            {
                key: 'basic_salary',
                header: 'Gaji Dasar',
                accessor: (e) => (e.basic_salary ? formatCurrency(e.basic_salary) : '-'),
            },
            {
                key: 'status',
                header: 'Status',
                accessor: (e) => <Badge className={getStatusBadge(e.status)}>{e.status}</Badge>,
            },
        ],
        [],
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const actionColumn: DataTableColumn<Employee> = {
        key: 'actions',
        header: '',
        align: 'right',
        // className: `sticky right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 z-10 min-w-[120px] border-l border-border ${stickyShadowRight}`,\
        cell: (e) => (
            <div className="flex items-center justify-end space-x-2">
                <Link href={route('hrms.employees.show', e.id)}>
                    <Button variant="outline" size={'icon'}>
                        <Edit />
                    </Button>
                </Link>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi Karyawan</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() =>
                                setResignDialog({
                                    open: true,
                                    employee: e,
                                    reason: '',
                                    date: new Date().toISOString().split('T')[0],
                                    loading: false,
                                })
                            }
                            className="text-orange-600"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Resign
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, employee: e })} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus Karyawan
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ),
    };

    const columns: DataTableColumn<Employee>[] = useMemo(
        () => [...baseColumns, ...optionalColumns.filter((c) => visible.includes(c.key)), actionColumn],
        [visible, baseColumns, optionalColumns, actionColumn],
    );

    // (Filter row removed per request; only show/hide columns retained)

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Karyawan" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header & Stats */}
                <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex flex-col items-start gap-2">
                        <h1 className="text-2xl font-semibold">Manajemen Karyawan</h1>
                        <p className="text-sm text-muted-foreground">Kelola data karyawan, termasuk penambahan, pengeditan, dan penghapusan.</p>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-5 @xl/main:grid-cols-2 @5xl/main:grid-cols-5 dark:*:data-[slot=card]:bg-card">
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Total Karyawan</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.totalEmployees}</CardTitle>
                                <div className="text-muted-foreground">Jumlah total karyawan yang terdaftar di sistem.</div>
                            </CardFooter>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Karyawan Aktif</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold text-green-600 tabular-nums @[250px]/card:text-3xl">
                                    {stats.activeEmployees}
                                </CardTitle>
                                <div className="text-muted-foreground">Karyawan yang aktif dan sedang bekerja.</div>
                            </CardFooter>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Karyawan Cuti</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold text-orange-600 tabular-nums @[250px]/card:text-3xl">
                                    {stats.leaveEmployees}
                                </CardTitle>
                                <div className="text-muted-foreground">Karyawan yang sedang cuti.</div>
                            </CardFooter>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Karyawan Internal</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold text-blue-600 tabular-nums @[250px]/card:text-3xl">
                                    {stats.internalEmployees}
                                </CardTitle>
                                <div className="text-muted-foreground">Karyawan internal perusahaan.</div>
                            </CardFooter>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Karyawan Outsourcing</CardDescription>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                <CardTitle className="text-2xl font-semibold text-purple-600 tabular-nums @[250px]/card:text-3xl">
                                    {stats.outsourcingEmployees}
                                </CardTitle>
                                <div className="text-muted-foreground">Karyawan dari vendor outsourcing.</div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex w-full flex-wrap items-end justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={route('hrms.employees.transfers.index')}>
                                <GitMerge className="h-4 w-4" /> Transfer
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    Kolom
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="max-h-80 w-56 overflow-y-auto p-2">
                                <DropdownMenuLabel>Kolom Opsional</DropdownMenuLabel>
                                {optionalColumns.map((col) => (
                                    <DropdownMenuItem key={col.key} asChild>
                                        <div className="flex cursor-pointer items-center gap-2" onClick={() => toggleColumn(col.key)}>
                                            <Checkbox checked={visible.includes(col.key)} onCheckedChange={() => toggleColumn(col.key)} />
                                            <span className="text-xs">{col.header}</span>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            placeholder="Cari pengguna..."
                            className="w-64"
                            type="search"
                            aria-label="Search users"
                            // defaultValue={search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button variant="outline" className="" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Karyawan
                        </Button>
                        <Button variant={hasActiveFilters ? 'default' : 'outline'} onClick={() => setShowFilters(!showFilters)} className="relative">
                            <FilterIcon className="mr-2 h-4 w-4" />
                            Filter
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-1 px-1 text-xs">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>Tambah Karyawan</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>
                                    <Link href={route('hrms.employees.create')}>Karyawan Baru</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Link href={route('hrms.employees.bulk')}>Bulk Karyawan</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FilterIcon className="h-5 w-5" />
                                    <CardTitle>Filter Karyawan</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasActiveFilters && (
                                        <Button variant="outline" size="sm" onClick={clearAllFilters}>
                                            <X className="mr-1 h-3 w-3" />
                                            Clear All
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardDescription>Filter dan sortir karyawan berdasarkan kriteria tertentu</CardDescription>
                        </CardHeader>
                        <div className="px-6 pb-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {/* Department Filter */}
                                <div className="space-y-2">
                                    <Label>Departemen</Label>
                                    <Select
                                        value={filters.department_id || 'all'}
                                        onValueChange={(value) => handleFilterChange('department_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Departemen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Departemen</SelectItem>
                                            {filterOptions.departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Position Filter */}
                                <div className="space-y-2">
                                    <Label>Posisi</Label>
                                    <Select value={filters.position_id || 'all'} onValueChange={(value) => handleFilterChange('position_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Posisi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Posisi</SelectItem>
                                            {filterOptions.positions.map((position) => (
                                                <SelectItem key={position.id} value={position.id.toString()}>
                                                    {position.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Position Level Filter */}
                                <div className="space-y-2">
                                    <Label>Level Posisi</Label>
                                    <Select value={filters.level_id || 'all'} onValueChange={(value) => handleFilterChange('level_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Level</SelectItem>
                                            {filterOptions.positionLevels.map((level) => (
                                                <SelectItem key={level.id} value={level.id.toString()}>
                                                    {level.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Employee Type Filter */}
                                <div className="space-y-2">
                                    <Label>Tipe Karyawan</Label>
                                    <Select
                                        value={filters.employee_type_id || 'all'}
                                        onValueChange={(value) => handleFilterChange('employee_type_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Tipe</SelectItem>
                                            {filterOptions.employeeTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Employment Status Filter */}
                                <div className="space-y-2">
                                    <Label>Status Pekerjaan</Label>
                                    <Select
                                        value={filters.employment_status_id || 'all'}
                                        onValueChange={(value) => handleFilterChange('employment_status_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            {filterOptions.employmentStatuses.map((status) => (
                                                <SelectItem key={status.id} value={status.id.toString()}>
                                                    {status.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <Label>Status Karyawan</Label>
                                    <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            {filterOptions.statuses.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Category Filter */}
                                <div className="space-y-2">
                                    <Label>Kategori</Label>
                                    <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Kategori</SelectItem>
                                            {filterOptions.categories.map((category) => (
                                                <SelectItem key={category.value} value={category.value}>
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Outsourcing Field Filter */}
                                {filters.category === 'outsourcing' && (
                                    <div className="space-y-2">
                                        <Label>Bidang Outsourcing</Label>
                                        <Select
                                            value={filters.outsourcing_field_id || 'all'}
                                            onValueChange={(value) => handleFilterChange('outsourcing_field_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semua Bidang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Bidang</SelectItem>
                                                {filterOptions.outsourcingFields.map((field) => (
                                                    <SelectItem key={field.id} value={field.id.toString()}>
                                                        {field.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Date and Salary Range Filters */}
                            <div className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Tanggal Bergabung (Dari)</Label>
                                    <Input
                                        type="date"
                                        value={filters.join_date_from || ''}
                                        onChange={(e) => handleFilterChange('join_date_from', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tanggal Bergabung (Sampai)</Label>
                                    <Input
                                        type="date"
                                        value={filters.join_date_to || ''}
                                        onChange={(e) => handleFilterChange('join_date_to', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Gaji Minimum</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={filters.salary_from || ''}
                                        onChange={(e) => handleFilterChange('salary_from', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Gaji Maksimum</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={filters.salary_to || ''}
                                        onChange={(e) => handleFilterChange('salary_to', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Active Filters Display */}
                            {hasActiveFilters && (
                                <div className="mt-4 border-t pt-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="text-sm font-medium">Filter Aktif:</span>
                                        <Badge variant="secondary">{activeFilterCount} filter</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(filters).map(([key, value]) => {
                                            if (!value) return null;

                                            let displayName = key;
                                            let displayValue = value;

                                            // Get display names for filters
                                            switch (key) {
                                                case 'department_id':
                                                    displayName = 'Departemen';
                                                    displayValue = filterOptions.departments.find((d) => d.id.toString() === value)?.name || value;
                                                    break;
                                                case 'position_id':
                                                    displayName = 'Posisi';
                                                    displayValue = filterOptions.positions.find((p) => p.id.toString() === value)?.name || value;
                                                    break;
                                                case 'level_id':
                                                    displayName = 'Level';
                                                    displayValue = filterOptions.positionLevels.find((l) => l.id.toString() === value)?.name || value;
                                                    break;
                                                case 'employee_type_id':
                                                    displayName = 'Tipe';
                                                    displayValue = filterOptions.employeeTypes.find((t) => t.id.toString() === value)?.name || value;
                                                    break;
                                                case 'employment_status_id':
                                                    displayName = 'Status Kerja';
                                                    displayValue =
                                                        filterOptions.employmentStatuses.find((s) => s.id.toString() === value)?.name || value;
                                                    break;
                                                case 'status':
                                                    displayName = 'Status';
                                                    displayValue = filterOptions.statuses.find((s) => s.value === value)?.label || value;
                                                    break;
                                                case 'category':
                                                    displayName = 'Kategori';
                                                    displayValue = filterOptions.categories.find((c) => c.value === value)?.label || value;
                                                    break;
                                                case 'outsourcing_field_id':
                                                    displayName = 'Bidang Outsourcing';
                                                    displayValue =
                                                        filterOptions.outsourcingFields.find((f) => f.id.toString() === value)?.name || value;
                                                    break;
                                                case 'join_date_from':
                                                    displayName = 'Bergabung Dari';
                                                    break;
                                                case 'join_date_to':
                                                    displayName = 'Bergabung Sampai';
                                                    break;
                                                case 'salary_from':
                                                    displayName = 'Gaji Min';
                                                    displayValue = formatCurrency(parseInt(value));
                                                    break;
                                                case 'salary_to':
                                                    displayName = 'Gaji Max';
                                                    displayValue = formatCurrency(parseInt(value));
                                                    break;
                                            }

                                            return (
                                                <Badge key={key} variant="outline" className="flex items-center gap-1">
                                                    <span className="text-xs">
                                                        {displayName}: {displayValue}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-auto p-0 hover:bg-transparent"
                                                        onClick={() => handleFilterChange(key, '')}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Unified DataTable */}
                <div ref={scrollContainerRef} onScroll={handleScroll} className="relative -mx-4 overflow-x-auto px-4">
                    <DataTable
                        data={data.data}
                        columns={columns}
                        emptyIcon={Users2}
                        emptyTitle="Belum ada karyawan"
                        emptyDescription="Tambahkan karyawan pertama Anda untuk mulai mengelola data HR."
                        tableClassName="min-w-max"
                    />
                </div>
                <PaginationLinks links={data.links} className="mt-10" />
                <TransferSheet
                    open={openTransfer}
                    onOpenChange={(o) => {
                        setOpenTransfer(o);
                        if (!o) {
                            setTransferEmployee(null);
                            resetForm();
                        }
                    }}
                    employeeId={transferEmployee?.id || null}
                    employeeName={transferEmployee?.full_name}
                    historyMode={historyView}
                    onSwitchMode={(h) => setHistoryView(h)}
                />

                {/* Delete Employee Dialog */}
                <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, employee: null })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Karyawan</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus karyawan "{deleteDialog.employee?.full_name}"? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="text-sm text-muted-foreground">
                                <p>
                                    ⚠️ <strong>Peringatan:</strong>
                                </p>
                                <ul className="mt-2 ml-4 list-disc space-y-1">
                                    <li>Data karyawan akan dihapus secara permanen</li>
                                    <li>Akun user terkait akan dinonaktifkan</li>
                                    <li>Riwayat absensi dan data terkait tetap tersimpan</li>
                                </ul>
                                <p className="mt-2 text-orange-600">
                                    <strong>Saran:</strong> Gunakan fitur "Resign" jika karyawan mengundurkan diri secara normal.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, employee: null })}>
                                Batal
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteEmployee}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus Karyawan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Resign Employee Dialog */}
                <Dialog
                    open={resignDialog.open}
                    onOpenChange={(open) =>
                        setResignDialog({
                            open,
                            employee: null,
                            reason: '',
                            date: new Date().toISOString().split('T')[0],
                            loading: false,
                        })
                    }
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Resign Karyawan</DialogTitle>
                            <DialogDescription>Ubah status karyawan "{resignDialog.employee?.full_name}" menjadi resign.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="resignation_date">Tanggal Resign *</Label>
                                <Input
                                    id="resignation_date"
                                    type="date"
                                    value={resignDialog.date}
                                    onChange={(e) => setResignDialog((prev) => ({ ...prev, date: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="resignation_reason">Alasan Resign (Opsional)</Label>
                                <Textarea
                                    id="resignation_reason"
                                    placeholder="Masukkan alasan resign karyawan..."
                                    value={resignDialog.reason}
                                    onChange={(e) => setResignDialog((prev) => ({ ...prev, reason: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                            <div className="rounded-lg bg-destructive p-3 text-sm text-muted-foreground">
                                <p>
                                    ℹ️ <strong>Informasi:</strong>
                                </p>
                                <ul className="mt-1 ml-4 list-disc space-y-1">
                                    <li>Status karyawan akan berubah menjadi "Resign"</li>
                                    <li>Akun user akan dinonaktifkan</li>
                                    <li>Data riwayat tetap tersimpan untuk keperluan audit</li>
                                </ul>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setResignDialog({
                                        open: false,
                                        employee: null,
                                        reason: '',
                                        date: new Date().toISOString().split('T')[0],
                                        loading: false,
                                    })
                                }
                                disabled={resignDialog.loading}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleResignEmployee}
                                disabled={resignDialog.loading || !resignDialog.date}
                                className="bg-orange-600 hover:bg-orange-700"
                            >
                                {resignDialog.loading ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Resign Karyawan
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
