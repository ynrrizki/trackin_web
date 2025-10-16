import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDuration, getInitials } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Edit, MapPin, Trash2, User, Clock3 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Absensi',
        href: '/hrms/attendance',
    },
    {
        title: 'Detail',
        href: '#',
    },
];

interface Attendance {
    id: number;
    employee_id: number;
    date: string;
    time_in: string;
    time_out?: string;
    latlot_in?: string;
    latlot_out?: string;
    is_fake_map_detected: boolean;
    notes?: string;
    employee: {
        id: number;
        full_name: string;
        employee_code: string;
        email?: string;
        phone?: string;
        photo_url?: string;
        department?: {
            id: number;
            name: string;
        };
        position?: {
            id: number;
            name: string;
        };
        shift?: {
            id: number;
            name: string;
            start_time: string;
            end_time: string;
        };
        employee_type?: {
            id: number;
            name: string;
        };
        outsourcing_field?: {
            id: number;
            name: string;
        };
    };
}

interface Props {
    attendance: Attendance;
}

export default function ShowAttendance({ attendance }: Props) {
    const getStatusBadge = () => {
        if (!attendance.time_in) {
            return <Badge variant="secondary">No Check-in</Badge>;
        }

        if (!attendance.time_out) {
            return <Badge variant="outline">Incomplete</Badge>;
        }

        // Check if late (simplified check - in real app you'd compare with shift times)
        const isLate = attendance.time_in > '09:00:00';

        return (
            <div className="flex gap-1">
                <Badge variant={isLate ? 'destructive' : 'default'}>{isLate ? 'Late' : 'On Time'}</Badge>
                <Badge variant="secondary">Complete</Badge>
            </div>
        );
    };

    const getLocationInfo = () => {
        if (attendance.latlot_in) {
            return (
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">GPS Location</span>
                    {attendance.is_fake_map_detected && (
                        <Badge variant="destructive" className="text-xs">
                            Fake Location Detected
                        </Badge>
                    )}
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Manual Entry</span>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attendance Details - ${attendance.employee?.full_name}`} />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <HeadingSmall
                        title="Attendance Details"
                        description={`View attendance record for ${attendance.employee?.full_name}`}
                    />
                    <div className="flex gap-2">
                        <Link href={`/hrms/attendance/${attendance.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Link href="/hrms/attendance">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to List
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Employee Information */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Employee Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                {attendance.employee?.photo_url ? (
                                    <img
                                        src={attendance.employee.photo_url}
                                        alt={attendance.employee.full_name}
                                        className="h-12 w-12 rounded-full border object-cover"
                                    />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-primary/10 text-sm font-medium text-primary">
                                        {getInitials(attendance.employee?.full_name || '')}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold">{attendance.employee?.full_name}</h3>
                                    <p className="text-sm text-muted-foreground">{attendance.employee?.employee_code}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                {attendance.employee?.email && (
                                    <div>
                                        <span className="text-sm font-medium">Email:</span>
                                        <p className="text-sm text-muted-foreground">{attendance.employee.email}</p>
                                    </div>
                                )}

                                {attendance.employee?.phone && (
                                    <div>
                                        <span className="text-sm font-medium">Phone:</span>
                                        <p className="text-sm text-muted-foreground">{attendance.employee.phone}</p>
                                    </div>
                                )}

                                {attendance.employee?.department && (
                                    <div>
                                        <span className="text-sm font-medium">Department:</span>
                                        <p className="text-sm text-muted-foreground">{attendance.employee.department.name}</p>
                                    </div>
                                )}

                                {attendance.employee?.position && (
                                    <div>
                                        <span className="text-sm font-medium">Position:</span>
                                        <p className="text-sm text-muted-foreground">{attendance.employee.position.name}</p>
                                    </div>
                                )}

                                {attendance.employee?.employee_type && (
                                    <div>
                                        <span className="text-sm font-medium">Employee Type:</span>
                                        <p className="text-sm text-muted-foreground">{attendance.employee.employee_type.name}</p>
                                    </div>
                                )}

                                {attendance.employee?.outsourcing_field && (
                                    <div>
                                        <span className="text-sm font-medium">Outsourcing Field:</span>
                                        <p className="text-sm text-muted-foreground">{attendance.employee.outsourcing_field.name}</p>
                                    </div>
                                )}

                                {attendance.employee?.shift && (
                                    <div>
                                        <span className="text-sm font-medium">Shift:</span>
                                        <p className="text-sm text-muted-foreground">
                                            {attendance.employee.shift.name} ({attendance.employee.shift.start_time} - {attendance.employee.shift.end_time})
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attendance Details */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Attendance Details
                            </CardTitle>
                            <CardDescription>
                                Detailed attendance information for {formatDate(attendance.date)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Status and Date */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{formatDate(attendance.date)}</span>
                                </div>
                                {getStatusBadge()}
                            </div>

                            <Separator />

                            {/* Time Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-green-600" />
                                        <span className="font-medium">Check In</span>
                                    </div>
                                    {attendance.time_in ? (
                                        <p className="text-lg font-mono">{attendance.time_in}</p>
                                    ) : (
                                        <p className="text-muted-foreground">No check-in recorded</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-red-600" />
                                        <span className="font-medium">Check Out</span>
                                    </div>
                                    {attendance.time_out ? (
                                        <p className="text-lg font-mono">{attendance.time_out}</p>
                                    ) : (
                                        <p className="text-muted-foreground">No check-out recorded</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Clock3 className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium">Duration</span>
                                    </div>
                                    <p className="text-lg font-mono">
                                        {formatDuration(attendance.time_in, attendance.time_out)}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-purple-600" />
                                        <span className="font-medium">Location</span>
                                    </div>
                                    {getLocationInfo()}
                                </div>
                            </div>

                            {/* Location Coordinates */}
                            {(attendance.latlot_in || attendance.latlot_out) && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h4 className="font-medium">GPS Coordinates</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {attendance.latlot_in && (
                                                <div className="space-y-1">
                                                    <span className="text-sm font-medium">Check-in Location:</span>
                                                    <p className="text-sm text-muted-foreground font-mono">{attendance.latlot_in}</p>
                                                </div>
                                            )}
                                            {attendance.latlot_out && (
                                                <div className="space-y-1">
                                                    <span className="text-sm font-medium">Check-out Location:</span>
                                                    <p className="text-sm text-muted-foreground font-mono">{attendance.latlot_out}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Notes */}
                            {attendance.notes && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Notes</h4>
                                        <p className="text-sm text-muted-foreground">{attendance.notes}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>
                            Perform actions on this attendance record
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Link href={`/hrms/attendance/${attendance.id}/edit`}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Record
                                </Button>
                            </Link>
                            <Button variant="destructive" className="ml-auto">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Record
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
