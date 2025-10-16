import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks';
import { useEmployeeApi } from '@/services/employee-api';
import { Employee } from '@/types';
// import { debugAuthState } from '@/utils/auth-debug';
import { Briefcase, Building2, Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface EmployeeSelectProps {
    onEmployeeSelect: (employee: Employee | null) => void;
    selectedEmployee: Employee | null;
    multiple?: boolean;
    selectedEmployees?: Employee[];
    onEmployeesSelect?: (employees: Employee[]) => void;
    searchPlaceholder?: string;
    emptyMessage?: string;
    className?: string;
}

export interface EmployeeApiResponse {
    employees: Employee[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export const EmployeeSelect: React.FC<EmployeeSelectProps> = ({
    onEmployeeSelect,
    selectedEmployee,
    multiple = false,
    selectedEmployees = [],
    onEmployeesSelect,
    searchPlaceholder = 'Search employees...',
    emptyMessage,
    className = '',
}) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const debouncedSearch = useDebounce(search, 500);
    const employeeApi = useEmployeeApi();

    const fetchEmployees = useCallback(
        async (searchTerm = '', pageNum = 1, append = false) => {
            setLoading(true);
            try {
                const response = await employeeApi.getEmployeesWithoutUsers({
                    search: searchTerm,
                    page: pageNum,
                    per_page: 20,
                });

                if (append) {
                    setEmployees((prev) => [...prev, ...response.employees]);
                } else {
                    setEmployees(response.employees);
                }

                if (response.meta) {
                    setHasMore(response.meta.current_page < response.meta.last_page);
                    setPage(response.meta.current_page);
                }
            } catch (error) {
                console.error('Error fetching employees:', error);
                if (error instanceof Error) {
                    const errorMessage = error.message;
                    if (errorMessage.includes('401')) {
                        toast.error('Authentication required. Please login again.');
                    } else if (errorMessage.includes('403')) {
                        toast.error('You do not have permission to view employees.');
                    } else {
                        toast.error('Failed to fetch employees: ' + errorMessage);
                    }
                } else {
                    toast.error('Failed to fetch employees');
                }
            } finally {
                setLoading(false);
            }
        },
        [employeeApi],
    );

    // Handle search with debounce
    useEffect(() => {
        setPage(1);
        fetchEmployees(debouncedSearch, 1, false);
    }, [debouncedSearch, fetchEmployees]);

    // Load more function
    const loadMore = () => {
        if (hasMore && !loading) {
            fetchEmployees(debouncedSearch, page + 1, true);
        }
    };

    // Handle employee selection
    const handleEmployeeClick = (employee: Employee) => {
        if (multiple) {
            const isSelected = selectedEmployees.some((emp) => emp.id === employee.id);
            if (isSelected) {
                onEmployeesSelect?.(selectedEmployees.filter((emp) => emp.id !== employee.id));
            } else {
                onEmployeesSelect?.([...selectedEmployees, employee]);
            }
        } else {
            onEmployeeSelect(employee);
        }
    };

    const isEmployeeSelected = (employee: Employee) => {
        if (multiple) {
            return selectedEmployees.some((emp) => emp.id === employee.id);
        }
        return selectedEmployee?.id === employee.id;
    };

    const getEmptyMessage = () => {
        if (emptyMessage) return emptyMessage;
        return search ? 'No employees found matching your search' : 'No employees without user accounts found';
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-500" />
                <Input placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            </div>

            {/* Multiple Selection Info */}
            {multiple && selectedEmployees.length > 0 && <div className="text-sm text-gray-600">{selectedEmployees.length} employee(s) selected</div>}

            {/* Selected Employee (Single Mode) */}
            {!multiple && selectedEmployee && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedEmployee.photo_url || undefined} />
                                    <AvatarFallback>
                                        {selectedEmployee.full_name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{selectedEmployee.full_name}</p>
                                    <p className="text-sm">{selectedEmployee.employee_code}</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onEmployeeSelect(null)}>
                                Change
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Selected Employees (Multiple Mode) */}
            {multiple && selectedEmployees.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Selected Employees:</Label>
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                        {selectedEmployees.map((employee) => (
                            <div key={employee.id} className="flex items-center justify-between rounded-md bg-blue-50 p-2">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={employee.photo_url || undefined} />
                                        <AvatarFallback className="text-xs">
                                            {employee.full_name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{employee.full_name}</span>
                                    <span className="text-xs text-gray-500">({employee.employee_code})</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEmployeeClick(employee)}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Employee List */}
            {(!selectedEmployee || multiple) && (
                <div className="max-h-80 overflow-y-auto rounded-md border">
                    {loading && employees.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                            Loading employees...
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">{getEmptyMessage()}</div>
                    ) : (
                        <div className="space-y-1 p-2">
                            {employees.map((employee) => {
                                const selected = isEmployeeSelected(employee);
                                return (
                                    <div
                                        key={employee.id}
                                        className={`flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors ${
                                            selected ? 'border border-blue-300 bg-blue-100' : 'hover:bg-accent'
                                        }`}
                                        onClick={() => handleEmployeeClick(employee)}
                                    >
                                        {multiple && (
                                            <Checkbox
                                                checked={selected}
                                                onChange={() => {}} // Handled by onClick
                                            />
                                        )}
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={employee.photo_url || undefined} />
                                            <AvatarFallback>
                                                {employee.full_name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{employee.full_name}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>{employee.employee_code}</span>
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {employee.department?.name || 'N/A'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="h-3 w-3" />
                                                    {employee.position?.name || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="p-2 text-center">
                                    <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            'Load More'
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
