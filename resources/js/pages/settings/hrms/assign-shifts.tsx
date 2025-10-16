import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Clock, Users, Building } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'HRMS Settings',
        href: '/settings/hrms',
    },
    {
        title: 'Pengaturan Shift',
        href: '/settings/hrms/shifts',
    },
    {
        title: 'Assign Shift',
        href: '/settings/hrms/assign-shifts',
    },
];

interface Shift {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
}

interface Employee {
    id: number;
    name: string;
    employee_id: string;
    shift?: {
        id: number;
        name: string;
    };
    department?: {
        id: number;
        name: string;
    };
}

interface Project {
    id: number;
    name: string;
    code: string;
    assigned_employees: Employee[];
    client?: {
        id: number;
        name: string;
    };
}

interface Props {
    shifts: Shift[];
    employees: Employee[];
    projects: Project[];
}

export default function AssignShifts({ shifts, employees, projects }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        shift_id: '',
        employee_ids: [] as number[],
        assignment_type: 'individual',
        project_id: '',
    });

    const filteredEmployees = employees.filter(employee =>
        (employee.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (employee.employee_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const handleEmployeeToggle = (employeeId: number) => {
        const newSelected = selectedEmployees.includes(employeeId)
            ? selectedEmployees.filter(id => id !== employeeId)
            : [...selectedEmployees, employeeId];

        setSelectedEmployees(newSelected);
        setData('employee_ids', newSelected);
    };

    const handleSelectAll = () => {
        if (selectedEmployees.length === filteredEmployees.length) {
            setSelectedEmployees([]);
            setData('employee_ids', []);
        } else {
            const allIds = filteredEmployees.map(emp => emp.id);
            setSelectedEmployees(allIds);
            setData('employee_ids', allIds);
        }
    };

    const handleProjectSelect = (projectId: string) => {
        setData('project_id', projectId);
        if (projectId) {
            const project = projects.find(p => p.id === parseInt(projectId));
            if (project) {
                const projectEmployeeIds = project.assigned_employees.map(emp => emp.id);
                setSelectedEmployees(projectEmployeeIds);
                setData('employee_ids', projectEmployeeIds);
            }
        } else {
            setSelectedEmployees([]);
            setData('employee_ids', []);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous validation errors
        setValidationErrors([]);
        const errors: string[] = [];

        // Validation
        if (!data.shift_id) {
            errors.push('Pilih shift terlebih dahulu');
        }

        if (data.assignment_type === 'individual' && selectedEmployees.length === 0) {
            errors.push('Pilih minimal satu karyawan');
        }

        if (data.assignment_type === 'project' && !data.project_id) {
            errors.push('Pilih proyek terlebih dahulu');
        }

        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        post(route('settings.hrms.assign-shifts.store'), {
            onSuccess: () => {
                setValidationErrors([]);
            }
        });
    };

    const formatTime = (time: string) => {
        return new Date(`1970-01-01T${time}`).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assign Shift ke Karyawan" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall
                            title="Assign Shift ke Karyawan"
                            description="Terapkan shift kerja ke karyawan secara individual atau berdasarkan proyek"
                        />
                        <Link href={route('settings.hrms.shifts')}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Kembali
                            </Button>
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Validation Errors */}
                        {validationErrors.length > 0 && (
                            <Card className="border-destructive bg-destructive/5">
                                <CardContent className="pt-6">
                                    <div className="text-sm text-destructive space-y-1">
                                        {validationErrors.map((error, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <span className="text-xs">•</span>
                                                <span>{error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Shift Selection */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <CardTitle>Pilih Shift</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Pilih shift yang akan diterapkan ke karyawan
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Shift</Label>
                                        <Select value={data.shift_id} onValueChange={(value) => setData('shift_id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih shift" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shifts.map((shift) => (
                                                    <SelectItem key={shift.id} value={shift.id.toString()}>
                                                        {shift.name} ({formatTime(shift.start_time)} - {formatTime(shift.end_time)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.shift_id} />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Assignment Type */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Metode Penugasan</CardTitle>
                                    <CardDescription>
                                        Pilih cara penugasan shift ke karyawan
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Metode Penugasan</Label>
                                        <Select
                                            value={data.assignment_type}
                                            onValueChange={(value: string) => setData('assignment_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih metode penugasan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="individual">Pilih Karyawan Individual</SelectItem>
                                                <SelectItem value="project">Berdasarkan Proyek</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {data.assignment_type === 'project' && (
                                        <div className="space-y-2">
                                            <Label>Proyek</Label>
                                            <Select value={data.project_id} onValueChange={handleProjectSelect}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih proyek" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {projects.map((project) => (
                                                        <SelectItem key={project.id} value={project.id.toString()}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{project.name}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {project.client ? `Client: ${project.client.name}` : 'Internal Project'} • {project.assigned_employees.length} karyawan
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.project_id} />

                                            {data.project_id && (
                                                <div className="text-sm text-muted-foreground">
                                                    {(() => {
                                                        const selectedProject = projects.find(p => p.id === parseInt(data.project_id));
                                                        return selectedProject ? (
                                                            <div>
                                                                Karyawan dari proyek ini akan dipilih secara otomatis ({selectedProject.assigned_employees.length} karyawan)
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Employee Selection */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                        <CardTitle>Pilih Karyawan</CardTitle>
                                    </div>
                                    <Badge variant="outline">
                                        {selectedEmployees.length} dari {filteredEmployees.length} karyawan
                                    </Badge>
                                </div>
                                <CardDescription>
                                    Pilih karyawan yang akan diterapkan shift tersebut
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.assignment_type === 'individual' && (
                                    <div className="flex items-center gap-4">
                                        <Input
                                            placeholder="Cari karyawan..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="max-w-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleSelectAll}
                                            size="sm"
                                        >
                                            {selectedEmployees.length === filteredEmployees.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                        </Button>
                                    </div>
                                )}

                                <div className="overflow-hidden rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">
                                                    {data.assignment_type === 'individual' && (
                                                        <Checkbox
                                                            checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                                                            onCheckedChange={handleSelectAll}
                                                        />
                                                    )}
                                                </TableHead>
                                                <TableHead>Karyawan</TableHead>
                                                <TableHead>NIP</TableHead>
                                                <TableHead>Departemen</TableHead>
                                                <TableHead>Shift Saat Ini</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredEmployees.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8">
                                                        Tidak ada karyawan yang ditemukan
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredEmployees.map((employee) => (
                                                    <TableRow key={employee.id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedEmployees.includes(employee.id)}
                                                                onCheckedChange={() => handleEmployeeToggle(employee.id)}
                                                                disabled={data.assignment_type === 'project'}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">{employee.name || '-'}</TableCell>
                                                        <TableCell>{employee.employee_id || '-'}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center">
                                                                <Building className="mr-1 h-3 w-3 text-muted-foreground" />
                                                                {employee.department?.name || '-'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {employee.shift ? (
                                                                <Badge variant="outline">{employee.shift.name}</Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">Belum ada</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <InputError message={errors.employee_ids} />
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={
                                    processing ||
                                    !data.shift_id ||
                                    (data.assignment_type === 'individual' && selectedEmployees.length === 0) ||
                                    (data.assignment_type === 'project' && !data.project_id)
                                }
                            >
                                {processing ? 'Menerapkan...' : (
                                    data.assignment_type === 'project' && data.project_id
                                        ? `Terapkan Shift ke Proyek (${selectedEmployees.length} Karyawan)`
                                        : `Terapkan Shift ke ${selectedEmployees.length} Karyawan`
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
