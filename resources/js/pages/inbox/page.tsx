import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import LockLayout from '@/layouts/lock-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Bell, Calendar, Check, CheckCircle, Clock, ExternalLink, Info, Search, User, X, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inbox',
        href: '/inbox',
    },
];

// Types
interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    action_url?: string;
}

interface Approval {
    id: number;
    type: 'leave_request' | 'overtime_request' | 'expense_claim' | 'document_approval';
    title: string;
    description: string;
    requester: {
        id: number;
        name: string;
        avatar?: string;
        department?: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    due_date?: string;
    created_at: string;
}

interface FilterState {
    search: string;
    type: 'all' | 'notifications' | 'approvals';
    status: 'all' | 'unread' | 'pending' | 'approved' | 'rejected';
}

interface InboxProps {
    notifications: Notification[];
    approvals: Approval[];
    stats: {
        total_notifications: number;
        unread_notifications: number;
        pending_approvals: number;
        urgent_approvals: number;
    };
}

export default function Inbox({ notifications, approvals, stats }: InboxProps) {
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        type: 'all',
        status: 'all',
    });

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        return notifications.filter((notification) => {
            if (
                filters.search &&
                !notification.title.toLowerCase().includes(filters.search.toLowerCase()) &&
                !notification.message.toLowerCase().includes(filters.search.toLowerCase())
            ) {
                return false;
            }
            if (filters.status === 'unread' && notification.is_read) return false;

            return true;
        });
    }, [notifications, filters]);

    // Filter approvals
    const filteredApprovals = useMemo(() => {
        return approvals.filter((approval) => {
            if (
                filters.search &&
                !approval.title.toLowerCase().includes(filters.search.toLowerCase()) &&
                !approval.description.toLowerCase().includes(filters.search.toLowerCase()) &&
                !approval.requester.name.toLowerCase().includes(filters.search.toLowerCase())
            ) {
                return false;
            }
            if (filters.status !== 'all' && approval.status !== filters.status) return false;

            return true;
        });
    }, [approvals, filters]);

    // Combined items for "All" tab
    const allItems = useMemo(() => {
        const items: Array<{ type: 'notification' | 'approval'; data: Notification | Approval; createdAt: string }> = [];

        if (filters.type === 'all' || filters.type === 'notifications') {
            filteredNotifications.forEach((notification) => {
                items.push({ type: 'notification', data: notification, createdAt: notification.created_at });
            });
        }

        if (filters.type === 'all' || filters.type === 'approvals') {
            filteredApprovals.forEach((approval) => {
                items.push({ type: 'approval', data: approval, createdAt: approval.created_at });
            });
        }

        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [filteredNotifications, filteredApprovals, filters.type]);

    const updateFilter = (key: keyof FilterState, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getStatusBadge = (status: Approval['status']) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        const labels = {
            pending: 'Menunggu',
            approved: 'Disetujui',
            rejected: 'Ditolak',
        };
        return <Badge className={colors[status]}>{labels[status]}</Badge>;
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
        return `${Math.floor(diffInMinutes / 1440)} hari yang lalu`;
    };

    const handleMarkAsRead = (notificationId: string) => {
        router.patch(
            `/inbox/notifications/${notificationId}/read`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleMarkAllAsRead = () => {
        router.patch(
            '/inbox/notifications/read-all',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleApprove = (approvalId: number) => {
        router.patch(
            `/inbox/approvals/${approvalId}/approve`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleReject = (approvalId: number) => {
        router.patch(
            `/inbox/approvals/${approvalId}/reject`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }
        if (notification.action_url) {
            router.visit(notification.action_url);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inbox" />
            <LockLayout title="Inbox" status="Dikunci" description="Halaman ini dikunci. Fitur ini akan segera tersedia pada phase 2.">
                <div className="container mx-auto space-y-6 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Inbox</h1>
                            <p className="text-muted-foreground">Kelola notifikasi dan approval Anda</p>
                        </div>
                        <Button variant="outline" onClick={() => router.reload()} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Notifikasi</CardTitle>
                                <Bell className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_notifications}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Belum Dibaca</CardTitle>
                                <Bell className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{stats.unread_notifications}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                                <Clock className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{stats.pending_approvals}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Urgent</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{stats.urgent_approvals}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filter & Pencarian</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-4 md:flex-row">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari notifikasi atau approval..."
                                            value={filters.search}
                                            onChange={(e) => updateFilter('search', e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="unread">Belum Dibaca</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Disetujui</SelectItem>
                                            <SelectItem value="rejected">Ditolak</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Content */}
                    <Tabs defaultValue="all" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="all" onClick={() => updateFilter('type', 'all')}>
                                    Semua ({allItems.length})
                                </TabsTrigger>
                                <TabsTrigger value="notifications" onClick={() => updateFilter('type', 'notifications')}>
                                    Notifikasi ({filteredNotifications.length})
                                </TabsTrigger>
                                <TabsTrigger value="approvals" onClick={() => updateFilter('type', 'approvals')}>
                                    Approval ({filteredApprovals.length})
                                </TabsTrigger>
                            </TabsList>

                            {stats.unread_notifications > 0 && (
                                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    Tandai Semua Sudah Dibaca
                                </Button>
                            )}
                        </div>

                        <TabsContent value="all" className="space-y-4">
                            {allItems.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-lg font-medium text-muted-foreground">Tidak ada item</p>
                                        <p className="text-sm text-muted-foreground">Semua notifikasi dan approval telah diproses</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                allItems.map((item) => (
                                    <Card
                                        key={`${item.type}-${item.data.id}`}
                                        className={`transition-all hover:shadow-md ${
                                            item.type === 'notification' && !(item.data as Notification).is_read
                                                ? 'border-l-4 border-l-blue-500 bg-blue-50/30'
                                                : ''
                                        }`}
                                    >
                                        <CardContent className="p-6">
                                            {item.type === 'notification' ? (
                                                <div
                                                    className="flex cursor-pointer items-start justify-between"
                                                    onClick={() => handleNotificationClick(item.data as Notification)}
                                                >
                                                    <div className="flex flex-1 items-start gap-4">
                                                        <div className="flex-shrink-0">{getNotificationIcon((item.data as Notification).type)}</div>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <h3
                                                                    className={`font-medium ${!(item.data as Notification).is_read ? 'font-semibold' : ''}`}
                                                                >
                                                                    {(item.data as Notification).title}
                                                                </h3>
                                                                {!(item.data as Notification).is_read && (
                                                                    <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                                                                        Baru
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">{(item.data as Notification).message}</p>
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {getTimeAgo((item.data as Notification).created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {(item.data as Notification).action_url && (
                                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        {!(item.data as Notification).is_read && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkAsRead((item.data as Notification).id);
                                                                }}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex flex-1 items-start gap-4">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarFallback>
                                                                    {(item.data as Approval).requester.name
                                                                        .split(' ')
                                                                        .map((n) => n[0])
                                                                        .join('')
                                                                        .slice(0, 2)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h3 className="font-medium">{(item.data as Approval).title}</h3>
                                                                    {getStatusBadge((item.data as Approval).status)}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">{(item.data as Approval).description}</p>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <User className="h-3 w-3" />
                                                                        {(item.data as Approval).requester.name}
                                                                    </span>
                                                                    {(item.data as Approval).requester.department && (
                                                                        <span>• {(item.data as Approval).requester.department}</span>
                                                                    )}
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {getTimeAgo((item.data as Approval).created_at)}
                                                                    </span>
                                                                    {(item.data as Approval).due_date && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Calendar className="h-3 w-3" />
                                                                            Deadline: {getTimeAgo((item.data as Approval).due_date!)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {(item.data as Approval).status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleReject((item.data as Approval).id)}
                                                                    className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                    Tolak
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleApprove((item.data as Approval).id)}
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                    Setujui
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="notifications" className="space-y-4">
                            {filteredNotifications.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-lg font-medium text-muted-foreground">Tidak ada notifikasi</p>
                                        <p className="text-sm text-muted-foreground">
                                            Semua notifikasi telah dibaca atau tidak ada yang sesuai filter
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <Card
                                        key={notification.id}
                                        className={`transition-all hover:shadow-md ${
                                            !notification.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                                        }`}
                                    >
                                        <CardContent className="p-6">
                                            <div
                                                className="flex cursor-pointer items-start justify-between"
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex flex-1 items-start gap-4">
                                                    <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className={`font-medium ${!notification.is_read ? 'font-semibold' : ''}`}>
                                                                {notification.title}
                                                            </h3>
                                                            {!notification.is_read && (
                                                                <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                                                                    Baru
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {getTimeAgo(notification.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {notification.action_url && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                                                    {!notification.is_read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification.id);
                                                            }}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="approvals" className="space-y-4">
                            {filteredApprovals.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-lg font-medium text-muted-foreground">Tidak ada approval</p>
                                        <p className="text-sm text-muted-foreground">
                                            Semua approval telah diproses atau tidak ada yang sesuai filter
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredApprovals.map((approval) => (
                                    <Card key={approval.id} className="transition-all hover:shadow-md">
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex flex-1 items-start gap-4">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarFallback>
                                                                {approval.requester.name
                                                                    .split(' ')
                                                                    .map((n) => n[0])
                                                                    .join('')
                                                                    .slice(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="font-medium">{approval.title}</h3>
                                                                {getStatusBadge(approval.status)}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">{approval.description}</p>
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <User className="h-3 w-3" />
                                                                    {approval.requester.name}
                                                                </span>
                                                                {approval.requester.department && <span>• {approval.requester.department}</span>}
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {getTimeAgo(approval.created_at)}
                                                                </span>
                                                                {approval.due_date && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        Deadline: {getTimeAgo(approval.due_date)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {approval.status === 'pending' && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleReject(approval.id)}
                                                                className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Tolak
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleApprove(approval.id)}
                                                                className="flex items-center gap-1"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                                Setujui
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </LockLayout>
        </AppLayout>
    );
}
