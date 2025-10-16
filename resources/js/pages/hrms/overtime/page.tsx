import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { AlertCircle, CheckCircle, Clock, DollarSign, Edit, Eye, Filter, Plus, Trash2, TrendingUp, Users, XCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Overtime',
        href: '/hrms/overtime',
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

interface Overtime {
    id: number;
    employee_id: number;
    date: string;
    start_time: string;
    end_time: string;
    description: string;
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
    total_hours: number;
    total_pay: number;
    approval_rate: number;
}

interface Props {
    overtimes: {
        data: Overtime[];
        links: Array<{
            url?: string;
            label: string;
            active: boolean;
        }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    employees: Employee[];
    departments: Department[];
    outsourcingFields: OutsourcingField[];
    filters: {
        date_from?: string;
        date_to?: string;
        employee_id?: string;
        department_id?: string;
        employee_type?: string;
        outsourcing_field_id?: string;
        search?: string;
        status?: string;
    };
    stats: Stats;
}

export default function OvertimeIndex({ overtimes, employees, departments, filters, stats }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [rejectDialogId, setRejectDialogId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const { delete: deleteForm, processing: deleteProcessing } = useForm();
    const { post: approveForm, processing: approveProcessing } = useForm();
    const [rejectProcessing, setRejectProcessing] = useState(false);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (timeString: string) => {
        const time = new Date(timeString);
        return time.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    };

    const calculateDuration = (startTime: string, endTime: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diff = end.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    const getStatusBadge = (overtime: Overtime) => {
        const status = overtime.approvable?.status || 'pending';

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

    const handleDelete = (id: number) => {
        if (deleteId === id) {
            deleteForm(`/hrms/overtime/${id}`, {
                onSuccess: () => setDeleteId(null),
            });
        } else {
            setDeleteId(id);
        }
    };

    const handleApprove = (id: number) => {
        approveForm(`/hrms/overtime/${id}/approve`);
    };

    const handleReject = (id: number) => {
        if (rejectDialogId === id) {
            setRejectProcessing(true);
            router.patch(
                `/hrms/overtime/${id}/reject`,
                {
                    rejection_reason: rejectionReason,
                },
                {
                    onSuccess: () => {
                        setRejectDialogId(null);
                        setRejectionReason('');
                        setRejectProcessing(false);
                    },
                    onError: () => {
                        setRejectProcessing(false);
                    },
                },
            );
        } else {
            setRejectDialogId(id);
        }
    };

    const handleFilter = (field: string, value: string) => {
        router.get(
            '/hrms/overtime',
            {
                ...filters,
                [field]: value,
            },
            {
                preserveState: true,
            },
        );
    };

    const clearFilters = () => {
        router.get('/hrms/overtime');
    };

    const { search, setSearch } = useInertiaSearch();

    const columns: DataTableColumn<Overtime>[] = [
        {
            key: 'employee',
            header: 'Employee',
            className: 'min-w-[180px]',
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.employee.full_name}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{row.employee.employee_code}</span>
                        {row.employee.outsourcing_field_id && (
                            <Badge variant="outline" className="text-xs">
                                {row.employee.outsourcing_field?.name}
                            </Badge>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">{row.employee.department?.name}</span>
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            cell: (row) => formatDate(row.date),
        },
        {
            key: 'time_period',
            header: 'Time Period',
            cell: (row) => (
                <div className="flex flex-col text-sm">
                    <span>{formatTime(row.start_time)} -</span>
                    <span>{formatTime(row.end_time)}</span>
                </div>
            ),
        },
        {
            key: 'duration',
            header: 'Duration',
            cell: (row) => (
                <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {calculateDuration(row.start_time, row.end_time)}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => getStatusBadge(row),
        },
        {
            key: 'description',
            header: 'Description',
            className: 'max-w-xs',
            cell: (row) => <div className="max-w-xs truncate text-sm">{row.description}</div>,
        },
        {
            key: 'actions',
            header: '',
            className: 'text-right w-0',
            cell: (row) => (
                <div className="flex justify-end gap-1">
                    <Link href={`/hrms/overtime/${row.id}`}>
                        <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                        </Button>
                    </Link>

                    {row.approvable?.status === 'pending' && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(row.id)}
                                disabled={approveProcessing}
                                className="text-green-600 hover:text-green-700"
                            >
                                <CheckCircle className="h-3 w-3" />
                            </Button>

                            <Dialog open={rejectDialogId === row.id} onOpenChange={(open) => !open && setRejectDialogId(null)}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                        <XCircle className="h-3 w-3" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject Overtime Request</DialogTitle>
                                        <DialogDescription>Please provide a reason for rejecting this overtime request.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <textarea
                                            className="min-h-[100px] w-full rounded-md border p-3"
                                            placeholder="Reason for rejection..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setRejectDialogId(null)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleReject(row.id)}
                                            disabled={rejectProcessing || !rejectionReason.trim()}
                                        >
                                            {rejectProcessing ? 'Rejecting...' : 'Reject Request'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}

                    {row.approvable?.status !== 'approved' && (
                        <>
                            <Link href={`/hrms/overtime/${row.id}/edit`}>
                                <Button variant="ghost" size="sm">
                                    <Edit className="h-3 w-3" />
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(row.id)}
                                disabled={deleteProcessing}
                                className={deleteId === row.id ? 'text-red-600' : ''}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Overtime Management" />
            <LockLayout title="Overtime Management" status="Dikunci" description="Halaman ini sedang dikunci. Fitur ini akan diaktifkan pada phase 2">
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="flex w-full flex-col items-start gap-4">
                        <div className="flex flex-col items-start gap-2">
                            <h1 className="text-2xl font-semibold">Overtime Management</h1>
                            <p className="text-sm text-muted-foreground">Manage employee overtime requests and approvals</p>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid w-full grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-7 @xl/main:grid-cols-2 @5xl/main:grid-cols-7 dark:*:data-[slot=card]:bg-card">
                            <Card className="@container/card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardDescription>Total Requests</CardDescription>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                        {stats.total_requests}
                                    </CardTitle>
                                    <div className="mt-1 text-sm text-muted-foreground">All overtime requests</div>
                                </CardContent>
                            </Card>

                            <Card className="@container/card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardDescription>Pending</CardDescription>
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-2xl font-semibold text-orange-600 tabular-nums @[250px]/card:text-3xl">
                                        {stats.pending_requests}
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
                                    <CardTitle className="text-2xl font-semibold text-green-600 tabular-nums @[250px]/card:text-3xl">
                                        {stats.approved_requests}
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
                                    <CardTitle className="text-2xl font-semibold text-red-600 tabular-nums @[250px]/card:text-3xl">
                                        {stats.rejected_requests}
                                    </CardTitle>
                                    <div className="mt-1 text-sm text-muted-foreground">Rejected requests</div>
                                </CardContent>
                            </Card>

                            <Card className="@container/card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardDescription>Total Hours</CardDescription>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.total_hours}</CardTitle>
                                    <div className="mt-1 text-sm text-muted-foreground">Hours worked overtime</div>
                                </CardContent>
                            </Card>

                            <Card className="@container/card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardDescription>Total Pay</CardDescription>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                        {new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: 0,
                                            notation: 'compact',
                                        }).format(stats.total_pay)}
                                    </CardTitle>
                                    <div className="mt-1 text-sm text-muted-foreground">Total overtime compensation</div>
                                </CardContent>
                            </Card>

                            <Card className="@container/card">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardDescription>Approval Rate</CardDescription>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                        {stats.approval_rate}%
                                    </CardTitle>
                                    <div className="mt-1 text-sm text-muted-foreground">Success rate</div>
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
                                // value={filters.search || ''}
                                // onChange={(e) => handleFilter('search', e.target.value)}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Button variant="outline">Export Overtime</Button>
                            <Link href="/hrms/overtime/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Overtime Request
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
                                                {employees.map((employee) => (
                                                    <SelectItem key={employee.id} value={employee.id.toString()}>
                                                        {employee.full_name} ({employee.employee_code})
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
                                        <Label>Employee Type</Label>
                                        <Select
                                            value={filters.employee_type ?? 'all'}
                                            onValueChange={(value) => handleFilter('employee_type', value === 'all' ? '' : value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All types</SelectItem>
                                                <SelectItem value="internal">Internal</SelectItem>
                                                <SelectItem value="outsourcing">Outsourcing</SelectItem>
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

                                    <div className="flex items-end">
                                        <Button variant="outline" onClick={clearFilters}>
                                            Clear Filters
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <DataTable
                        data={overtimes.data}
                        columns={columns}
                        emptyTitle="No overtime requests"
                        emptyDescription="Overtime submissions will appear here."
                        emptyIcon={Clock}
                    />
                </div>
            </LockLayout>
        </AppLayout>
    );
}
