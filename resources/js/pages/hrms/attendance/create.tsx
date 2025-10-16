import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import SelectEmployeeDialog, { type PickerEmployee } from '@/components/hrms/SelectEmployeeDialogNew';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Clock, User, UserPlus } from 'lucide-react';
import { useState } from 'react';

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
        title: 'Manual Entry',
        href: '/hrms/attendance/create',
    },
];

export default function CreateAttendance() {
    const [selectedEmployees, setSelectedEmployees] = useState<PickerEmployee[]>([]);
    const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        time_in: '',
        time_out: '',
        notes: '',
    });

    // Update form data when employee is selected
    const handleEmployeeChange = (employees: PickerEmployee[]) => {
        setSelectedEmployees(employees);
        setData('employee_id', employees.length > 0 ? employees[0].id.toString() : '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hrms/attendance');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Manual Attendance Entry" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <HeadingSmall
                        title="Add Manual Attendance Entry"
                        description="Create attendance record manually for employees"
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
                            Fill in the attendance details for the employee
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Employee Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="employee_id">
                                        Employee <span className="text-red-500">*</span>
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => setShowEmployeeDialog(true)}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        {selectedEmployees.length > 0
                                            ? `${selectedEmployees[0].full_name} (${selectedEmployees[0].employee_code})`
                                            : 'Select Employee'
                                        }
                                    </Button>
                                    <InputError message={errors.employee_id} />

                                    <SelectEmployeeDialog
                                        open={showEmployeeDialog}
                                        onOpenChange={setShowEmployeeDialog}
                                        value={selectedEmployees}
                                        onChange={handleEmployeeChange}
                                        multiple={false}
                                        labels={{
                                            title: 'Select Employee',
                                            select: 'Select Employee',
                                            cancel: 'Cancel',
                                        }}
                                    />
                                </div>

                                {/* Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="date">
                                        Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.date} />
                                </div>

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

                            {/* Employee Preview */}
                            {selectedEmployees.length > 0 && (
                                <Card className="bg-muted/30">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Selected Employee
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {(() => {
                                            const employee = selectedEmployees[0];
                                            return (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium">Name:</span>
                                                        <span className="text-sm">{employee.full_name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-medium">Employee Code:</span>
                                                        <span className="text-sm">{employee.employee_code}</span>
                                                    </div>
                                                    {employee.department && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium">Department:</span>
                                                            <span className="text-sm">{employee.department.name}</span>
                                                        </div>
                                                    )}
                                                    {employee.position && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium">Position:</span>
                                                            <span className="text-sm">{employee.position.name}</span>
                                                        </div>
                                                    )}
                                                    {employee.employee_type && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm font-medium">Type:</span>
                                                            <span className="text-sm">{employee.employee_type.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end gap-4">
                                <Link href="/hrms/attendance">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing || selectedEmployees.length === 0 || !data.date || !data.time_in}
                                >
                                    {processing ? 'Creating...' : 'Create Attendance Entry'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
