import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Clock, User } from 'lucide-react';

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
        title: 'Edit',
        href: '#',
    },
];

interface Attendance {
    id: number;
    employee_id: number;
    date: string;
    time_in: string;
    time_out?: string;
    notes?: string;
    employee: {
        id: number;
        full_name: string;
        employee_code: string;
        department?: {
            id: number;
            name: string;
        };
        position?: {
            id: number;
            name: string;
        };
        employee_type?: {
            id: number;
            name: string;
        };
    };
}

interface Props {
    attendance: Attendance;
}

export default function EditAttendance({ attendance }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        time_in: attendance.time_in,
        time_out: attendance.time_out || '',
        notes: attendance.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/hrms/attendance/${attendance.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Attendance - ${attendance.employee?.full_name}`} />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <HeadingSmall
                        title="Edit Attendance Entry"
                        description={`Modify attendance record for ${attendance.employee?.full_name}`}
                    />
                    <Link href="/hrms/attendance">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to List
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Attendance Information
                        </CardTitle>
                        <CardDescription>
                            Edit the attendance details for the employee
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Employee Info (Read-only) */}
                            <Card className="bg-muted/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Employee Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium">Name:</span>
                                            <span className="text-sm">{attendance.employee?.full_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium">Employee Code:</span>
                                            <span className="text-sm">{attendance.employee?.employee_code}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium">Date:</span>
                                            <span className="text-sm">{attendance.date}</span>
                                        </div>
                                        {attendance.employee?.department && (
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium">Department:</span>
                                                <span className="text-sm">{attendance.employee.department.name}</span>
                                            </div>
                                        )}
                                        {attendance.employee?.position && (
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium">Position:</span>
                                                <span className="text-sm">{attendance.employee.position.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Time In */}
                                <div className="space-y-2">
                                    <Label htmlFor="time_in">
                                        Check In Time <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="time_in"
                                        type="time"
                                        value={data.time_in}
                                        onChange={(e) => setData('time_in', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.time_in} />
                                </div>

                                {/* Time Out */}
                                <div className="space-y-2">
                                    <Label htmlFor="time_out">
                                        Check Out Time
                                    </Label>
                                    <Input
                                        id="time_out"
                                        type="time"
                                        value={data.time_out}
                                        onChange={(e) => setData('time_out', e.target.value)}
                                    />
                                    <InputError message={errors.time_out} />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty if employee hasn't checked out yet
                                    </p>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Additional notes about this attendance entry..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                />
                                <InputError message={errors.notes} />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-4">
                                <Link href="/hrms/attendance">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing || !data.time_in}
                                >
                                    {processing ? 'Updating...' : 'Update Attendance Entry'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
