import { PaginationLinks } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Replaced manual Table with reusable DataTable component
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInertiaSearch } from '@/hooks/use-inertia-search';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDuration, getInitials } from '@/lib/utils';
import attendanceService from '@/services/attendanceService';
import { Employee, type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Calendar, Clock, Download, Edit, Eye, Filter as FilterIcon, MapPin, Trash2, TrendingUp, Users, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Absensi',
        href: '/hrms/attendance',
    },
];

// interface Employee {
//     id: number;
//     full_name: string;
//     employee_code: string;
//     department?: {
//         id: number;
//         name: string;
//     };
// }

interface FilterOptions {
    employees: Array<{ id: number; full_name: string; employee_code: string; department?: { id: number; name: string } }>;
    departments: Array<{ id: number; name: string }>;
    shifts: Array<{ id: number; name: string }>;
    outsourcingFields: Array<{ id: number; name: string }>;
    employeeTypes: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
}

interface Attendance {
    id: number;
    employee_id: number;
    date: string;
    time_in: string;
    time_out?: string;
    latlot_in?: string;
    latlot_out?: string;
    is_fake_map_detected: boolean;
    // employee: {
    //     id: number;
    //     full_name: string;
    //     employee_code: string;
    //     outsourcing_field_id?: number;
    //     department?: {
    //         id: number;
    //         name: string;
    //     };
    //     shift?: {
    //         id: number;
    //         name: string;
    //     };
    //     outsourcing_field?: {
    //         id: number;
    //         name: string;
    //     };
    // };
    employee: Employee;
}

interface Stats {
    total_records: number;
    complete_records: number;
    incomplete_records: number;
    late_records: number;
    completion_rate: number;
}

interface Filters {
    date_from?: string;
    date_to?: string;
    employee_id?: string;
    department_id?: string;
    shift_id?: string;
    employee_type?: string;
    outsourcing_field_id?: string;
    search?: string;
    status?: string;
}

interface Props {
    attendances: {
        data: Attendance[];
        links: Array<{
            url: string;
            label: string;
            active: boolean;
        }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    filterOptions: FilterOptions;
    filters: Filters;
    stats: Stats;
}

export default function AttendanceIndex({ attendances, filterOptions, filters, stats }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [exportLoading, setExportLoading] = useState(false);

    const { delete: deleteForm, processing } = useForm();

    const getStatusBadge = (attendance: Attendance) => {
        if (!attendance.time_in) {
            return <Badge variant="secondary">No Check-in</Badge>;
        }

        if (!attendance.time_out) {
            return <Badge variant="outline">Incomplete</Badge>;
        }

        // Check if late (assuming shift start time comparison would be here)
        const isLate = attendance.time_in > '09:00:00'; // Simplified check

        return (
            <div className="flex gap-1">
                <Badge variant={isLate ? 'destructive' : 'default'}>{isLate ? 'Late' : 'On Time'}</Badge>
                <Badge variant="secondary">Complete</Badge>
            </div>
        );
    };

    const handleDelete = (id: number) => {
        if (deleteId === id) {
            deleteForm(`/hrms/attendance/${id}`, {
                onSuccess: () => setDeleteId(null),
            });
        } else {
            setDeleteId(id);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        const currentFilters = { ...filters };
        if (value === '' || value === 'all') {
            delete currentFilters[key as keyof Filters];
        } else {
            currentFilters[key as keyof Filters] = value;
        }

        router.get('/hrms/attendance', currentFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearAllFilters = () => {
        router.get(
            '/hrms/attendance',
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
        if (exportLoading) return;

        setExportLoading(true);
        try {
            const exportParams: Record<string, string | number | boolean> = { ...filters };
            if (search) {
                exportParams.search = search;
            }

            const response = await attendanceService.exportAttendance({
                params: exportParams,
            });
            const name = 'attendance-export-' + new Date().toISOString().slice(0, 10) + '.xlsx';
            attendanceService.downloadBlob(response, name);

            toast.success('Data absensi berhasil diekspor');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Gagal mengekspor data absensi');
        } finally {
            setExportLoading(false);
        }
    };

    const { search, setSearch } = useInertiaSearch();

    // DataTable columns configuration
    const columns: DataTableColumn<Attendance>[] = [
        {
            key: 'employee',
            header: 'Karyawan',
            // className: 'min-w-[180px]',
            // cell: (row) => (
            //     <div className="flex flex-col">
            //         <span className="font-medium">{row.employee.full_name}</span>
            //         <div className="flex items-center gap-2 text-sm text-muted-foreground">
            //             <span>{row.employee.employee_code}</span>
            //             {row.employee.outsourcing_field_id && (
            //                 <Badge variant="outline" className="text-xs">
            //                     {row.employee.outsourcing_field?.name}
            //                 </Badge>
            //             )}
            //         </div>
            //         <span className="text-xs text-muted-foreground">{row.employee.department?.name}</span>
            //     </div>
            // ),
            cell: (e) => (
                <div className="flex items-start gap-3">
                    {e.employee.photo_url ? (
                        <img src={e.employee.photo_url} alt={e.employee.full_name} className="h-9 w-9 rounded-full border object-cover" />
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-primary/10 text-xs font-medium text-primary">
                            {getInitials(e.employee.full_name)}
                        </div>
                    )}
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex min-w-0 items-center gap-2">
                            {/* <span className="max-w-[140px] truncate font-medium">{e.full_name}</span> */}
                            <span className="max-w-full truncate font-medium">{e.employee.full_name}</span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                            <Badge variant="outline" className="px-1 py-0 font-mono text-base leading-5">
                                {e.employee.employee_code}
                            </Badge>
                            <span className="truncate text-base text-muted-foreground">{e.employee.email}</span>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Tanggal',
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {formatDate(row.date)}
                </div>
            ),
        },
        {
            key: 'time_in',
            header: 'Check In',
            cell: (row) =>
                row.time_in ? (
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-green-600" />
                        {row.time_in}
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                ),
        },
        {
            key: 'time_out',
            header: 'Check Out',
            cell: (row) =>
                row.time_out ? (
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-red-600" />
                        {row.time_out}
                    </div>
                ) : (
                    <span className="text-muted-foreground">-</span>
                ),
        },
        {
            key: 'duration',
            header: 'Durasi',
            cell: (row) => formatDuration(row.time_in, row.time_out),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => getStatusBadge(row),
        },
        {
            key: 'location',
            header: 'Lokasi',
            cell: (row) =>
                row.latlot_in ? (
                    <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">GPS</span>
                        {row.is_fake_map_detected && (
                            <Badge variant="destructive" className="text-xs">
                                Fake
                            </Badge>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">Manual</span>
                ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right w-0',
            cell: (row) => (
                <div className="flex justify-end gap-1">
                    <Link href={`/hrms/attendance/${row.id}`}>
                        <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                        </Button>
                    </Link>
                    <Link href={`/hrms/attendance/${row.id}/edit`}>
                        <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.id)}
                        disabled={processing}
                        className={deleteId === row.id ? 'text-red-600' : ''}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Absensi" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex w-full flex-col items-start gap-4">
                    <div className="flex flex-col items-start gap-2">
                        <h1 className="text-2xl font-semibold">Absensi</h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola catatan absensi karyawan, pantau kehadiran, keterlambatan, dan penyelesaian absensi mereka.
                        </p>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid w-full grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-5 @xl/main:grid-cols-2 @5xl/main:grid-cols-5 dark:*:data-[slot=card]:bg-card">
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Total Records</CardDescription>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.total_records}</CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">All attendance records in system</div>
                            </CardContent>
                        </Card>

                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Complete</CardDescription>
                                <Clock className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold text-green-600 tabular-nums @[250px]/card:text-3xl">
                                    {stats.complete_records}
                                </CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">Records with check-in and check-out</div>
                            </CardContent>
                        </Card>

                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Incomplete</CardDescription>
                                <Clock className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold text-orange-600 tabular-nums @[250px]/card:text-3xl">
                                    {stats.incomplete_records}
                                </CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">Missing check-out records</div>
                            </CardContent>
                        </Card>

                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Late Arrivals</CardDescription>
                                <Clock className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold text-red-600 tabular-nums @[250px]/card:text-3xl">
                                    {stats.late_records}
                                </CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">Employees arriving late</div>
                            </CardContent>
                        </Card>

                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Completion Rate</CardDescription>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.completion_rate}%</CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">Overall attendance completion</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex w-full items-end justify-between">
                    <div></div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            placeholder="Search employees..."
                            className="w-64"
                            type="search"
                            aria-label="Search employees"
                            value={search || ''}
                            // defaultValue={filters.search || ''}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button variant="outline" onClick={handleExport} disabled={exportLoading}>
                            <Download className="mr-2 h-4 w-4" />
                            {exportLoading ? 'Exporting...' : 'Export Attendance'}
                        </Button>
                        {/* <Link href="/hrms/attendance/bulk-create">
                            <Button variant="outline">
                                <Users className="mr-2 h-4 w-4" />
                                Bulk Entry
                            </Button>
                        </Link> */}
                        <Button variant={hasActiveFilters ? 'default' : 'outline'} onClick={() => setShowFilters(!showFilters)} className="relative">
                            <FilterIcon className="mr-2 h-4 w-4" />
                            Filter
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                        {/* <Link href="/hrms/attendance/create">
                            <Button>
                                Add Manual Entry
                            </Button>
                        </Link> */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>Tambah Manual</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>
                                    <Link href={route('hrms.attendance.create')}>Tambah Absensi</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Link href={route('hrms.attendance.bulk-create')}>Bulk Absensi</Link>
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
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FilterIcon className="h-5 w-5" />
                                        Filter Absensi
                                        {activeFilterCount > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {activeFilterCount} aktif
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription>Filter dan sortir data absensi berdasarkan kriteria tertentu</CardDescription>
                                </div>
                                {hasActiveFilters && (
                                    <Button variant="outline" size="sm" onClick={clearAllFilters}>
                                        <X className="mr-2 h-4 w-4" />
                                        Hapus Semua Filter
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <div className="px-6 pb-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {/* Date Range Filters */}
                                <div className="space-y-2">
                                    <Label htmlFor="date_from">Tanggal Mulai</Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={filters.date_from || ''}
                                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date_to">Tanggal Selesai</Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={filters.date_to || ''}
                                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                {/* Employee Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="employee_filter">Karyawan</Label>
                                    <Select value={filters.employee_id || 'all'} onValueChange={(value) => handleFilterChange('employee_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Karyawan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Karyawan</SelectItem>
                                            {filterOptions.employees.map((employee) => (
                                                <SelectItem key={employee.id} value={employee.id.toString()}>
                                                    {employee.full_name} ({employee.employee_code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Department Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="department_filter">Department</Label>
                                    <Select
                                        value={filters.department_id || 'all'}
                                        onValueChange={(value) => handleFilterChange('department_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Department</SelectItem>
                                            {filterOptions.departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Shift Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="shift_filter">Shift</Label>
                                    <Select value={filters.shift_id || 'all'} onValueChange={(value) => handleFilterChange('shift_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Shift" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Shift</SelectItem>
                                            {filterOptions.shifts.map((shift) => (
                                                <SelectItem key={shift.id} value={shift.id.toString()}>
                                                    {shift.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Employee Type Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="employee_type_filter">Tipe Karyawan</Label>
                                    <Select
                                        value={filters.employee_type || 'all'}
                                        onValueChange={(value) => handleFilterChange('employee_type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Semua Tipe" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Tipe</SelectItem>
                                            {filterOptions.employeeTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Outsourcing Field Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="outsourcing_field_filter">Bidang Outsourcing</Label>
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

                                {/* Status Filter */}
                                <div className="space-y-2">
                                    <Label htmlFor="status_filter">Status Absensi</Label>
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
                            </div>

                            {/* Active Filters Display */}
                            {hasActiveFilters && (
                                <div className="mt-4 border-t pt-4">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-sm font-medium text-muted-foreground">Filter aktif:</span>
                                        {filters.date_from && (
                                            <Badge variant="secondary" className="gap-1">
                                                Dari: {filters.date_from}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('date_from', '')} />
                                            </Badge>
                                        )}
                                        {filters.date_to && (
                                            <Badge variant="secondary" className="gap-1">
                                                Sampai: {filters.date_to}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('date_to', '')} />
                                            </Badge>
                                        )}
                                        {filters.employee_id && (
                                            <Badge variant="secondary" className="gap-1">
                                                Karyawan: {filterOptions.employees.find((e) => e.id.toString() === filters.employee_id)?.full_name}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('employee_id', '')} />
                                            </Badge>
                                        )}
                                        {filters.department_id && (
                                            <Badge variant="secondary" className="gap-1">
                                                Dept: {filterOptions.departments.find((d) => d.id.toString() === filters.department_id)?.name}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('department_id', '')} />
                                            </Badge>
                                        )}
                                        {filters.shift_id && (
                                            <Badge variant="secondary" className="gap-1">
                                                Shift: {filterOptions.shifts.find((s) => s.id.toString() === filters.shift_id)?.name}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('shift_id', '')} />
                                            </Badge>
                                        )}
                                        {filters.employee_type && (
                                            <Badge variant="secondary" className="gap-1">
                                                Tipe: {filterOptions.employeeTypes.find((t) => t.value === filters.employee_type)?.label}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('employee_type', '')} />
                                            </Badge>
                                        )}
                                        {filters.outsourcing_field_id && (
                                            <Badge variant="secondary" className="gap-1">
                                                Bidang:{' '}
                                                {filterOptions.outsourcingFields.find((f) => f.id.toString() === filters.outsourcing_field_id)?.name}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() => handleFilterChange('outsourcing_field_id', '')}
                                                />
                                            </Badge>
                                        )}
                                        {filters.status && (
                                            <Badge variant="secondary" className="gap-1">
                                                Status: {filterOptions.statuses.find((s) => s.value === filters.status)?.label}
                                                <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange('status', '')} />
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                <DataTable
                    data={attendances.data}
                    columns={columns}
                    emptyTitle="No attendance records"
                    emptyDescription="Attendance records will appear here once employees check in."
                    emptyIcon={Calendar}
                />
                <PaginationLinks links={attendances.links} className="mt-10" />
            </div>
        </AppLayout>
    );
}
