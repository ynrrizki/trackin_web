import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import HeadingSmall from '@/components/heading-small';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, User, FileText, Clock } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Leave',
        href: '/hrms/leave',
    },
    {
        title: 'Create Request',
        href: '/hrms/leave/create',
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
    outsourcing_field?: {
        id: number;
        name: string;
    };
    outsourcing_field_id?: number;
}

interface Props {
    employees: Employee[];
}

const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', color: 'bg-blue-100 text-blue-800' },
    { value: 'sick', label: 'Sick Leave', color: 'bg-red-100 text-red-800' },
    { value: 'maternity', label: 'Maternity Leave', color: 'bg-pink-100 text-pink-800' },
    { value: 'paternity', label: 'Paternity Leave', color: 'bg-purple-100 text-purple-800' },
    { value: 'personal', label: 'Personal Leave', color: 'bg-gray-100 text-gray-800' },
    { value: 'emergency', label: 'Emergency Leave', color: 'bg-orange-100 text-orange-800' },
];

export default function LeaveCreate({ employees }: Props) {
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
    });

    const handleEmployeeChange = (employeeId: string) => {
        const employee = employees.find(e => e.id.toString() === employeeId);
        setSelectedEmployee(employee || null);
        setData('employee_id', employeeId);
    };

    const calculateDuration = () => {
        if (!data.start_date || !data.end_date) return null;

        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);

        if (endDate < startDate) return null;

        // Calculate business days
        let count = 0;
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            // Count Monday to Friday (1-5)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return count;
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getSelectedLeaveType = () => {
        return leaveTypes.find(type => type.value === data.leave_type);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hrms/leave');
    };

    const duration = calculateDuration();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Leave Request" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/hrms/leave">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Leave
                        </Button>
                    </Link>
                    <HeadingSmall
                        title="Create Leave Request"
                        description="Submit a new leave request for employee"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Leave Request Form
                                </CardTitle>
                                <CardDescription>
                                    Fill out the form below to create a leave request
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Employee Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="employee_id" className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Employee
                                        </Label>
                                        <Select
                                            value={data.employee_id}
                                            onValueChange={handleEmployeeChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select employee" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employees.map((employee) => (
                                                    <SelectItem
                                                        key={employee.id}
                                                        value={employee.id.toString()}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{employee.full_name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {employee.employee_code} - {employee.department?.name}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.employee_id && (
                                            <p className="text-sm text-red-600">{errors.employee_id}</p>
                                        )}
                                    </div>

                                    {/* Leave Type */}
                                    <div className="space-y-2">
                                        <Label htmlFor="leave_type">Leave Type</Label>
                                        <Select
                                            value={data.leave_type}
                                            onValueChange={(value) => setData('leave_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select leave type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {leaveTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className={type.color}>
                                                                {type.label}
                                                            </Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.leave_type && (
                                            <p className="text-sm text-red-600">{errors.leave_type}</p>
                                        )}
                                    </div>

                                    {/* Date Range */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="start_date" className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                Start Date
                                            </Label>
                                            <Input
                                                type="date"
                                                id="start_date"
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                                min={getTodayDate()}
                                            />
                                            {errors.start_date && (
                                                <p className="text-sm text-red-600">{errors.start_date}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="end_date" className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                End Date
                                            </Label>
                                            <Input
                                                type="date"
                                                id="end_date"
                                                value={data.end_date}
                                                onChange={(e) => setData('end_date', e.target.value)}
                                                min={data.start_date || getTodayDate()}
                                            />
                                            {errors.end_date && (
                                                <p className="text-sm text-red-600">{errors.end_date}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Duration Display */}
                                    {data.start_date && data.end_date && duration !== null && (
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-medium text-blue-900">
                                                    Duration: {duration} business day{duration !== 1 ? 's' : ''}
                                                </span>
                                                {duration === 0 && (
                                                    <span className="text-xs text-red-600">(No business days selected)</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reason */}
                                    <div className="space-y-2">
                                        <Label htmlFor="reason">
                                            Reason for Leave
                                        </Label>
                                        <Textarea
                                            id="reason"
                                            placeholder="Please provide a detailed reason for your leave request..."
                                            value={data.reason}
                                            onChange={(e) => setData('reason', e.target.value)}
                                            rows={4}
                                        />
                                        {errors.reason && (
                                            <p className="text-sm text-red-600">{errors.reason}</p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Link href="/hrms/leave">
                                            <Button variant="outline" disabled={processing}>
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Creating...' : 'Create Leave Request'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview Panel */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Request Preview</CardTitle>
                                <CardDescription>
                                    Review your leave request details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Employee Info */}
                                {selectedEmployee ? (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Employee</Label>
                                        <div className="p-3 bg-accent rounded-lg">
                                            <div className="font-medium">{selectedEmployee.full_name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {selectedEmployee.employee_code}
                                            </div>
                                            {selectedEmployee.department && (
                                                <div className="text-sm text-muted-foreground">
                                                    {selectedEmployee.department.name}
                                                </div>
                                            )}
                                            {selectedEmployee.outsourcing_field_id && (
                                                <Badge variant="outline" className="mt-1">
                                                    {selectedEmployee.outsourcing_field?.name}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Employee</Label>
                                        <div className="p-3 bg-accent rounded-lg text-muted-foreground text-sm">
                                            No employee selected
                                        </div>
                                    </div>
                                )}

                                {/* Leave Type */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Leave Type</Label>
                                    <div className="p-3 bg-accent rounded-lg">
                                        {getSelectedLeaveType() ? (
                                            <Badge variant="outline" className={getSelectedLeaveType()?.color}>
                                                {getSelectedLeaveType()?.label}
                                            </Badge>
                                        ) : (
                                            <div className="text-muted-foreground text-sm">
                                                No leave type selected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Leave Period</Label>
                                    <div className="p-3 bg-accent rounded-lg text-sm">
                                        {data.start_date && data.end_date ? (
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {new Date(data.start_date).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                <div className="text-muted-foreground">to</div>
                                                <div className="font-medium">
                                                    {new Date(data.end_date).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                {duration !== null && (
                                                    <div className="text-blue-600 font-medium mt-2">
                                                        Duration: {duration} business day{duration !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground">
                                                No dates selected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Reason</Label>
                                    <div className="p-3 bg-accent rounded-lg text-sm">
                                        {data.reason ? (
                                            <div className="whitespace-pre-wrap">{data.reason}</div>
                                        ) : (
                                            <div className="text-muted-foreground">
                                                No reason provided
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Status</Label>
                                    <div className="p-3 bg-accent rounded-lg">
                                        <Badge variant="outline">
                                            Pending Approval
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Guidelines */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-sm">Leave Policy Guidelines</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>Annual leave: 12 days per year</li>
                                    <li>Sick leave: Submit within 1 day if possible</li>
                                    <li>Emergency leave: Immediate approval required</li>
                                    <li>Maternity leave: Submit 1 month in advance</li>
                                    <li>All requests require supervisor approval</li>
                                    <li>Weekend days are not counted as leave days</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
