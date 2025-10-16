import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Employee } from '@/types';
import { Role } from '@/types/role-permission';
import {
    Search,
    MoreVertical,
    User,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Calendar,
    Building2,
    Briefcase
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { InviteUserDialog, BulkInviteDialog } from './invite-user-dialog';

interface EmployeeTableProps {
    employees: Employee[];
    roles: Role[];
    onInviteSuccess?: () => void;
}

interface EmployeeFilters {
    search: string;
    department: string;
    position: string;
    hasUser: string; // 'all', 'with-user', 'without-user'
}

export function EmployeeTable({ employees, roles, onInviteSuccess }: EmployeeTableProps) {
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [filters, setFilters] = useState<EmployeeFilters>({
        search: '',
        department: '',
        position: '',
        hasUser: 'all',
    });

    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(employees);

    // Filter employees based on filters
    useEffect(() => {
        let filtered = employees;

        // Search filter
        if (filters.search) {
            filtered = filtered.filter(emp =>
                emp.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                emp.employee_code.toLowerCase().includes(filters.search.toLowerCase()) ||
                emp.email.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Department filter
        if (filters.department) {
            filtered = filtered.filter(emp => emp.department?.name === filters.department);
        }

        // Position filter
        if (filters.position) {
            filtered = filtered.filter(emp => emp.position?.name === filters.position);
        }

        // User status filter
        if (filters.hasUser === 'with-user') {
            filtered = filtered.filter(emp => emp.user_id);
        } else if (filters.hasUser === 'without-user') {
            filtered = filtered.filter(emp => !emp.user_id);
        }

        setFilteredEmployees(filtered);
    }, [employees, filters]);

    // Get unique departments and positions for filter dropdowns
    const departments = [...new Set(employees.map(emp => emp.department?.name).filter(Boolean))];
    const positions = [...new Set(employees.map(emp => emp.position?.name).filter(Boolean))];

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedEmployees(filteredEmployees.map(emp => emp.id));
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleSelectEmployee = (employeeId: number, checked: boolean) => {
        if (checked) {
            setSelectedEmployees(prev => [...prev, employeeId]);
        } else {
            setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
        }
    };

    const getSelectedEmployeesWithoutUsers = () => {
        return filteredEmployees.filter(emp =>
            selectedEmployees.includes(emp.id) && !emp.user_id
        );
    };

    const getUserStatusBadge = (employee: Employee) => {
        if (employee.user_id) {
            return (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Has User
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                <UserX className="h-3 w-3 mr-1" />
                No User
            </Badge>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Employee Management</h2>
                    <p className="text-gray-600">
                        Manage employees and invite them to create user accounts
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedEmployees.length > 0 && (
                        <BulkInviteDialog
                            employees={getSelectedEmployeesWithoutUsers()}
                            roles={roles}
                            onSuccess={() => {
                                setSelectedEmployees([]);
                                onInviteSuccess?.();
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    id="search"
                                    placeholder="Search employees..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select
                                value={filters.department || 'all'}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, department: value === 'all' ? '' : value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept || ''}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Position</Label>
                            <Select
                                value={filters.position || 'all'}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, position: value === 'all' ? '' : value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Positions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Positions</SelectItem>
                                    {positions.map((pos) => (
                                        <SelectItem key={pos} value={pos || ''}>{pos}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>User Status</Label>
                            <Select
                                value={filters.hasUser}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, hasUser: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    <SelectItem value="with-user">With User Account</SelectItem>
                                    <SelectItem value="without-user">Without User Account</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Info */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Showing {filteredEmployees.length} of {employees.length} employees
                    {selectedEmployees.length > 0 && (
                        <span className="ml-2 font-medium">
                            ({selectedEmployees.length} selected)
                        </span>
                    )}
                </p>
                {selectedEmployees.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEmployees([])}
                    >
                        Clear Selection
                    </Button>
                )}
            </div>

            {/* Employee Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Join Date</TableHead>
                                <TableHead>User Status</TableHead>
                                <TableHead className="w-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedEmployees.includes(employee.id)}
                                            onCheckedChange={(checked) =>
                                                handleSelectEmployee(employee.id, checked as boolean)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={employee.photo_url || undefined} />
                                                <AvatarFallback>
                                                    {employee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{employee.full_name}</p>
                                                <p className="text-sm text-gray-500">{employee.employee_code}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-sm">
                                                <Mail className="h-3 w-3 text-gray-400" />
                                                {employee.email}
                                            </div>
                                            {employee.phone && (
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <Phone className="h-3 w-3 text-gray-400" />
                                                    {employee.phone}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Building2 className="h-3 w-3 text-gray-400" />
                                            <span className="text-sm">{employee.department?.name || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Briefcase className="h-3 w-3 text-gray-400" />
                                            <span className="text-sm">{employee.position?.name || 'N/A'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-gray-400" />
                                            <span className="text-sm">
                                                {employee.join_date
                                                    ? new Date(employee.join_date).toLocaleDateString('id-ID')
                                                    : 'N/A'
                                                }
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getUserStatusBadge(employee)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    <User className="h-4 w-4 mr-2" />
                                                    View Details
                                                </DropdownMenuItem>
                                                {employee.user_id && (
                                                    <DropdownMenuItem>
                                                        <UserCheck className="h-4 w-4 mr-2" />
                                                        Manage User Account
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        {!employee.user_id && (
                                            <InviteUserDialog
                                                employee={employee}
                                                roles={roles}
                                                onSuccess={onInviteSuccess}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {filteredEmployees.length === 0 && (
                <Card>
                    <CardContent className="text-center py-8">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                        <p className="text-gray-600">
                            {filters.search || filters.department || filters.position || filters.hasUser !== 'all'
                                ? 'Try adjusting your search criteria or filters.'
                                : 'No employees have been added yet.'
                            }
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
