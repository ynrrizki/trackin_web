import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Replaced manual Table with reusable DataTable component
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { useInertiaSearch } from '@/hooks/use-inertia-search';
import AppLayout from '@/layouts/app-layout';
import LockLayout from '@/layouts/lock-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertCircle, Calendar, CheckCircle, Edit, Eye, Filter, Plus, Trash2, TrendingUp, Users, XCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Leave',
        href: '/hrms/leave',
    },
];

interface Employee {
    id: number;
    full_name: string;
    employee_code: string;
    department?: {
        id: number;
        name: string;
    };
}

interface Department {
    id: number;
    name: string;
}

interface OutsourcingField {
    id: number;
    name: string;
}

interface LeaveRequest {
    id: number;
    employee_id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    days_count: number;
    reason: string;
    employee: {
        id: number;
        full_name: string;
        employee_code: string;
        outsourcing_field_id?: number;
        department?: {
            id: number;
            name: string;
        };
        outsourcing_field?: {
            id: number;
            name: string;
        };
    };
    approvable?: {
        status: 'pending' | 'approved' | 'rejected';
        rejection_reason?: string;
    };
}

interface Stats {
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    rejected_requests: number;
    total_days: number;
    average_days: number;
}

interface Props {
    leaveRequests: {
        data: LeaveRequest[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            links: Array<{
                url: string | null;
                label: string;
                active: boolean;
            }>;
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
        total: number;
    };
    employees: Employee[];
    departments: Department[];
    outsourcing_fields: OutsourcingField[];
    stats: Stats;
    filters: {
        search?: string;
        employee_id?: string;
        department_id?: string;
        outsourcing_field_id?: string;
        status?: string;
        leave_type?: string;
        date_from?: string;
        date_to?: string;
    };
}
// Allow Partial props to avoid runtime crashes if backend data shape changes or is momentarily absent
export default function LeaveIndex(props: Partial<Props>) {
    const { leaveRequests, employees = [], departments = [], stats, filters = {} } = props;

    // Defensive fallbacks so UI can render a skeleton instead of crashing
    const safeLeaves = leaveRequests ?? {
        data: [],
        links: [],
        meta: {
            current_page: 1,
            from: 0,
            last_page: 1,
            links: [],
            path: '',
            per_page: 0,
            to: 0,
            total: 0,
        },
        total: 0,
    };

    // Provide fallback stats so UI remains stable
    const safeStats: Stats = stats ?? {
        total_requests: 0,
        pending_requests: 0,
        approved_requests: 0,
        rejected_requests: 0,
        total_days: 0,
        average_days: 0,
    };

    const [showFilters, setShowFilters] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { delete: deleteForm } = useForm();

    const handleFilter = (key: string, value: string) => {
        const currentFilters = { ...filters };
        if (value) {
            currentFilters[key as keyof typeof filters] = value;
        } else {
            delete currentFilters[key as keyof typeof filters];
        }

        router.get('/hrms/leave', currentFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (leave: LeaveRequest) => {
        const status = leave.approvable?.status || 'pending';

        switch (status) {
            case 'approved':
                return (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approved
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Pending
                    </Badge>
                );
        }
    };

    // const getLeaveTypeBadge = (type: string) => {
    //     const colors = {
    //         annual: 'bg-blue-100 text-blue-800',
    //         sick: 'bg-red-100 text-red-800',
    //         maternity: 'bg-pink-100 text-pink-800',
    //         paternity: 'bg-purple-100 text-purple-800',
    //         personal: 'bg-orange-100 text-orange-800',
    //         emergency: 'bg-yellow-100 text-yellow-800',
    //     };

    //     return (
    //         <Badge variant="outline" className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
    //             {type.charAt(0).toUpperCase() + type.slice(1)}
    //         </Badge>
    //     );
    // };

    const handleDelete = (id: number) => {
        if (deleteId === id) {
            deleteForm(`/hrms/leave/${id}`, {
                onSuccess: () => setDeleteId(null),
            });
        } else {
            setDeleteId(id);
        }
    };

    const handleApprove = (id: number) => {
        router.post(`/hrms/leave/${id}/approve`);
    };

    const handleReject = (id: number) => {
        router.post(`/hrms/leave/${id}/reject`);
    };

    const clearFilters = () => {
        router.get('/hrms/leave');
    };

    const { search, setSearch } = useInertiaSearch();

    // DataTable columns definition
    const columns: DataTableColumn<LeaveRequest>[] = [
        {
            key: 'employee',
            header: 'Employee',
            className: 'min-w-[180px]',
            cell: (row) => (
                <div className="space-y-1">
                    <div className="font-medium">{row.employee.full_name}</div>
                    <div className="text-sm text-muted-foreground">{row.employee.employee_code}</div>
                    <div className="text-xs text-muted-foreground">{row.employee.department?.name || row.employee.outsourcing_field?.name}</div>
                </div>
            ),
        },
        {
            key: 'leave_type',
            header: 'Leave Type',
            cell: () => <span>-</span>, // placeholder until leave type badge logic reintroduced
        },
        {
            key: 'dates',
            header: 'Dates',
            cell: (row) => (
                <div className="space-y-1">
                    <div className="text-sm">
                        {formatDate(row.start_date)} - {formatDate(row.end_date)}
                    </div>
                </div>
            ),
        },
        {
            key: 'days_count',
            header: 'Days',
            cell: (row) => <Badge variant="outline">{row.days_count} days</Badge>,
        },
        {
            key: 'reason',
            header: 'Reason',
            className: 'max-w-40',
            cell: (row) => <div className="max-w-40 truncate text-sm">{row.reason}</div>,
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => getStatusBadge(row),
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right w-0',
            cell: (row) => (
                <div className="flex items-center justify-end gap-2">
                    <Link href={`/hrms/leave/${row.id}`}>
                        <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    {row.approvable?.status === 'pending' && (
                        <>
                            <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleApprove(row.id)}>
                                <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleReject(row.id)}>
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    <Link href={`/hrms/leave/${row.id}/edit`}>
                        <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="sm"
                        className={deleteId === row.id ? 'text-red-600 hover:text-red-700' : ''}
                        onClick={() => handleDelete(row.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leave Management" />
            <LockLayout
                title="Leave Management"
                status="Dikunci"
                description="Halaman ini sedang dikunci. Fitur ini akan diaktifkan pada phase 2"
            >
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="flex flex-col items-start gap-2">
                        <h1 className="text-2xl font-semibold">Leave Management</h1>
                        <p className="text-sm text-muted-foreground">Manage employee leave requests and approvals</p>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-6 dark:*:data-[slot=card]:bg-card">
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Total Requests</CardDescription>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {safeStats.total_requests}
                                </CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">All leave requests</div>
                            </CardContent>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Pending</CardDescription>
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {safeStats.pending_requests}
                                </CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">Awaiting approval</div>
                            </CardContent>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Approved</CardDescription>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {safeStats.approved_requests}
                                </CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">Approved requests</div>
                            </CardContent>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Rejected</CardDescription>
                                <XCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {safeStats.rejected_requests}
                                </CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">Rejected requests</div>
                            </CardContent>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Total Days</CardDescription>
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{safeStats.total_days}</CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">Leave days taken</div>
                            </CardContent>
                        </Card>
                        <Card className="@container/card">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardDescription>Average Days</CardDescription>
                                <TrendingUp className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                    {safeStats.average_days || 0}
                                </CardTitle>
                                <div className="mt-1 text-sm text-muted-foreground">Per employee</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex w-full flex-wrap items-end justify-between">
                        <div></div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Input
                                placeholder="Search employees..."
                                className="w-64"
                                type="search"
                                aria-label="Search employees"
                                // value={filters.search || ''}
                                // onChange={(e) => handleFilter('search', e.target.value)}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Button variant="outline">Export Leave</Button>
                            <Link href="/hrms/leave/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Leave Request
                                </Button>
                            </Link>
                            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Filters
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label>Date From</Label>
                                        <Input
                                            type="date"
                                            value={filters.date_from || ''}
                                            onChange={(e) => handleFilter('date_from', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Date To</Label>
                                        <Input type="date" value={filters.date_to || ''} onChange={(e) => handleFilter('date_to', e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Employee</Label>
                                        <Select
                                            value={filters.employee_id ?? 'all'}
                                            onValueChange={(value) => handleFilter('employee_id', value === 'all' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All employees" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All employees</SelectItem>
                                                {employees.map((emp) => (
                                                    <SelectItem key={emp.id} value={emp.id.toString()}>
                                                        {emp.full_name} ({emp.employee_code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Select
                                            value={filters.department_id ?? 'all'}
                                            onValueChange={(value) => handleFilter('department_id', value === 'all' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All departments" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All departments</SelectItem>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Leave Type</Label>
                                        <Select
                                            value={filters.leave_type ?? 'all'}
                                            onValueChange={(value) => handleFilter('leave_type', value === 'all' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All types</SelectItem>
                                                <SelectItem value="annual">Annual</SelectItem>
                                                <SelectItem value="sick">Sick</SelectItem>
                                                <SelectItem value="maternity">Maternity</SelectItem>
                                                <SelectItem value="paternity">Paternity</SelectItem>
                                                <SelectItem value="personal">Personal</SelectItem>
                                                <SelectItem value="emergency">Emergency</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={filters.status ?? 'all'}
                                            onValueChange={(value) => handleFilter('status', value === 'all' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All status</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Search</Label>
                                        <Input
                                            placeholder="Employee name or code..."
                                            value={filters.search || ''}
                                            onChange={(e) => handleFilter('search', e.target.value)}
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <Button variant="outline" onClick={clearFilters}>
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex flex-col gap-2">
                        {/* <div className="text-sm text-muted-foreground">Total {safeLeaves.total} requests found</div> */}
                        <DataTable
                            data={safeLeaves.data}
                            columns={columns}
                            emptyTitle="No leave requests"
                            emptyDescription="Leave requests will appear here."
                            emptyIcon={Calendar}
                        />
                        {safeLeaves.links && safeLeaves.links.length > 3 && (
                            <div className="flex items-center justify-between px-2 py-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {safeLeaves.meta?.from || 0} to {safeLeaves.meta?.to || 0} of {safeLeaves.total} results
                                </div>
                                <div className="flex items-center gap-2">
                                    {safeLeaves.links.map((link, index) => (
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
                </div>
            </LockLayout>
        </AppLayout>
    );
}
