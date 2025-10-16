import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import SelectEmployeeDialog, { type PickerEmployee } from '@/components/hrms/SelectEmployeeDialogNew';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Clock, Users, UserPlus, X, CalendarDays } from 'lucide-react';
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
        title: 'Bulk Entry',
        href: '/hrms/attendance/bulk-create',
    },
];

export default function BulkCreateAttendance() {
    const [selectedEmployees, setSelectedEmployees] = useState<PickerEmployee[]>([]);
    const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        employee_ids: [] as number[],
        date: new Date().toISOString().split('T')[0],
        time_in: '',
        time_out: '',
        notes: '',
    });

    // Update form data when employees are selected
    const handleEmployeeChange = (employees: PickerEmployee[]) => {
        setSelectedEmployees(employees);
        setData('employee_ids', employees.map(emp => emp.id));
    };

    const removeEmployee = (employeeId: number) => {
        const updated = selectedEmployees.filter(emp => emp.id !== employeeId);
        setSelectedEmployees(updated);
        setData('employee_ids', updated.map(emp => emp.id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hrms/attendance/bulk-store');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bulk Attendance Entry" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <HeadingSmall
                        title="Bulk Attendance Entry"
                        description="Create attendance records for multiple employees at once"
                    />
                    <Link href="/hrms/attendance">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to List
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Employee Selection */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Select Employees
                            </CardTitle>
                            <CardDescription>
                                Choose employees for bulk attendance entry
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => setShowEmployeeDialog(true)}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Select Employees ({selectedEmployees.length})
                            </Button>

                            <SelectEmployeeDialog
                                open={showEmployeeDialog}
                                onOpenChange={setShowEmployeeDialog}
                                value={selectedEmployees}
                                onChange={handleEmployeeChange}
                                multiple={true}
                                labels={{
                                    title: 'Select Employees',
                                    select: 'Select Employees',
                                    cancel: 'Cancel',
                                    selectAll: 'Select All',
                                    unselectAll: 'Unselect All',
                                    clearSelection: 'Clear Selection',
                                }}
                            />

                            {/* Selected Employees List */}
                            {selectedEmployees.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        Selected Employees ({selectedEmployees.length})
                                    </Label>
                                    <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                                        {selectedEmployees.map((employee) => (
                                            <div
                                                key={employee.id}
                                                className="flex items-center justify-between p-2 bg-muted rounded-md"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {employee.full_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {employee.employee_code}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeEmployee(employee.id)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <InputError message={errors.employee_ids} />
                        </CardContent>
                    </Card>

                    {/* Attendance Details */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Attendance Information
                            </CardTitle>
                            <CardDescription>
                                Set attendance details for all selected employees
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                            Leave empty if employees haven't checked out yet
                                        </p>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Additional notes for all attendance entries..."
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={3}
                                    />
                                    <InputError message={errors.notes} />
                                </div>

                                {/* Preview */}
                                {selectedEmployees.length > 0 && (
                                    <Card className="bg-muted/30">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4" />
                                                Bulk Entry Preview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="secondary">
                                                        {selectedEmployees.length} Employee(s)
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        Date: {data.date}
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        Time In: {data.time_in || 'Not set'}
                                                    </Badge>
                                                    {data.time_out && (
                                                        <Badge variant="secondary">
                                                            Time Out: {data.time_out}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    This will create {selectedEmployees.length} attendance record(s) with the same date and time information.
                                                </p>
                                            </div>
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
                                        {processing ? 'Creating...' : `Create ${selectedEmployees.length} Attendance Records`}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
