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
import { ArrowLeft, Clock, User, Calendar, FileText } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Overtime',
        href: '/hrms/overtime',
    },
    {
        title: 'Create Request',
        href: '/hrms/overtime/create',
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

export default function OvertimeCreate({ employees }: Props) {
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        date: '',
        start_time: '',
        end_time: '',
        description: '',
    });

    const handleEmployeeChange = (employeeId: string) => {
        const employee = employees.find(e => e.id.toString() === employeeId);
        setSelectedEmployee(employee || null);
        setData('employee_id', employeeId);
    };

    const calculateDuration = () => {
        if (!data.start_time || !data.end_time) return null;

        const startTime = new Date(`2000-01-01T${data.start_time}`);
        const endTime = new Date(`2000-01-01T${data.end_time}`);

        if (endTime <= startTime) return null;

        const diff = endTime.getTime() - startTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hrms/overtime');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Overtime Request" />

            <div className="space-y-6 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/hrms/overtime">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Overtime
                        </Button>
                    </Link>
                    <HeadingSmall
                        title="Create Overtime Request"
                        description="Submit a new overtime request for employee"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Overtime Request Form
                                </CardTitle>
                                <CardDescription>
                                    Fill out the form below to create an overtime request
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

                                    {/* Date */}
                                    <div className="space-y-2">
                                        <Label htmlFor="date" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Overtime Date
                                        </Label>
                                        <Input
                                            type="date"
                                            id="date"
                                            value={data.date}
                                            onChange={(e) => setData('date', e.target.value)}
                                            max={getTodayDate()}
                                        />
                                        {errors.date && (
                                            <p className="text-sm text-red-600">{errors.date}</p>
                                        )}
                                    </div>

                                    {/* Time Range */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="start_time" className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                Start Time
                                            </Label>
                                            <Input
                                                type="time"
                                                id="start_time"
                                                value={data.start_time}
                                                onChange={(e) => setData('start_time', e.target.value)}
                                            />
                                            {errors.start_time && (
                                                <p className="text-sm text-red-600">{errors.start_time}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="end_time" className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                End Time
                                            </Label>
                                            <Input
                                                type="time"
                                                id="end_time"
                                                value={data.end_time}
                                                onChange={(e) => setData('end_time', e.target.value)}
                                            />
                                            {errors.end_time && (
                                                <p className="text-sm text-red-600">{errors.end_time}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Duration Display */}
                                    {data.start_time && data.end_time && (
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm font-medium text-blue-900">
                                                    Duration: {calculateDuration() || 'Invalid time range'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Describe the reason for overtime and work to be performed..."
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows={4}
                                        />
                                        {errors.description && (
                                            <p className="text-sm text-red-600">{errors.description}</p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Link href="/hrms/overtime">
                                            <Button variant="outline" disabled={processing}>
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Creating...' : 'Create Overtime Request'}
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
                                    Review your overtime request details
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

                                {/* Date & Time */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Date & Time</Label>
                                    <div className="p-3 bg-accent rounded-lg text-sm">
                                        {data.date ? (
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    {new Date(data.date).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                {(data.start_time || data.end_time) && (
                                                    <div className="text-muted-foreground">
                                                        {data.start_time || '--:--'} - {data.end_time || '--:--'}
                                                    </div>
                                                )}
                                                {calculateDuration() && (
                                                    <div className="text-blue-600 font-medium">
                                                        Duration: {calculateDuration()}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground">
                                                No date selected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Description</Label>
                                    <div className="p-3 bg-accent rounded-lg text-sm">
                                        {data.description ? (
                                            <div className="whitespace-pre-wrap">{data.description}</div>
                                        ) : (
                                            <div className="text-muted-foreground">
                                                No description provided
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
                                <CardTitle className="text-sm">Guidelines</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>Overtime requests must be submitted within 3 days</li>
                                    <li>Minimum overtime duration is 1 hour</li>
                                    <li>All requests require supervisor approval</li>
                                    <li>Provide detailed work description</li>
                                    <li>Cannot exceed maximum monthly overtime limits</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
