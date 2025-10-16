import { Employee } from '@/types';
import axios, { AxiosResponse } from 'axios';
import { useMemo } from 'react';

export interface EmployeeApiResponse {
    success: boolean;
    employees: Employee[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface EmployeeSearchParams {
    search?: string;
    page?: number;
    per_page?: number;
    status?: 'active' | 'inactive' | 'terminated';
    without_users?: boolean;
}

/**
 * Employee API service for handling employee-related requests
 */
export class EmployeeApiService {
    private static instance: EmployeeApiService;
    private baseUrl = '/api/employees';

    public static getInstance(): EmployeeApiService {
        if (!EmployeeApiService.instance) {
            EmployeeApiService.instance = new EmployeeApiService();
        }
        return EmployeeApiService.instance;
    }

    /**
     * Get employees without user accounts with pagination and search
     */
    async getEmployeesWithoutUsers(params: EmployeeSearchParams = {}): Promise<EmployeeApiResponse> {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.set('page', params.page.toString());
        if (params.per_page) searchParams.set('per_page', params.per_page.toString());
        if (params.search) searchParams.set('search', params.search);
        if (params.status) searchParams.set('status', params.status);

        const response: AxiosResponse<EmployeeApiResponse> = await axios.get(`${this.baseUrl}/without-users?${searchParams.toString()}`);

        return response.data;
    }

    /**
     * Get all employees with optional filters
     */
    async getEmployees(params: EmployeeSearchParams = {}): Promise<EmployeeApiResponse> {
        const searchParams = new URLSearchParams();

        if (params.search) searchParams.set('search', params.search);
        if (params.status) searchParams.set('status', params.status);
        if (params.without_users) searchParams.set('without_users', 'true');

        const response: AxiosResponse<EmployeeApiResponse> = await axios.get(`${this.baseUrl}?${searchParams.toString()}`);

        return response.data;
    }

    /**
     * Get single employee by ID
     */
    async getEmployee(id: number): Promise<{ success: boolean; employee: Employee }> {
        const response = await axios.get(`${this.baseUrl}/${id}`);
        return response.data;
    }

    /**
     * Search employees with debounced input
     */
    async searchEmployees(query: string, options: Omit<EmployeeSearchParams, 'search'> = {}): Promise<EmployeeApiResponse> {
        return this.getEmployeesWithoutUsers({
            ...options,
            search: query,
        });
    }

    /**
     * Get paginated employees for infinite loading
     */
    async getEmployeesPaginated(
        page: number = 1,
        perPage: number = 20,
        search?: string,
        append: boolean = false,
    ): Promise<EmployeeApiResponse & { append: boolean }> {
        const result = await this.getEmployeesWithoutUsers({
            page,
            per_page: perPage,
            search,
        });

        return {
            ...result,
            append,
        };
    }
}

/**
 * Hook-like function for employee API operations
 */
export const useEmployeeApi = () => {
    const api = EmployeeApiService.getInstance();

    // return {
    //     getEmployeesWithoutUsers: api.getEmployeesWithoutUsers.bind(api),
    //     getEmployees: api.getEmployees.bind(api),
    //     getEmployee: api.getEmployee.bind(api),
    //     searchEmployees: api.searchEmployees.bind(api),
    //     getEmployeesPaginated: api.getEmployeesPaginated.bind(api),
    // };

    const memoizedApi = useMemo(() => {
        return {
            getEmployeesWithoutUsers: api.getEmployeesWithoutUsers.bind(api),
            getEmployees: api.getEmployees.bind(api),
            getEmployee: api.getEmployee.bind(api),
            searchEmployees: api.searchEmployees.bind(api),
            getEmployeesPaginated: api.getEmployeesPaginated.bind(api),
        };
    }, [api]);

    return memoizedApi;
};

/**
 * Utility functions for employee operations
 */
export const employeeUtils = {
    /**
     * Generate employee initials from full name
     */
    getInitials: (fullName: string): string => {
        return fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    },

    /**
     * Format employee display name with code
     */
    getDisplayName: (employee: Employee): string => {
        return `${employee.full_name} (${employee.employee_code})`;
    },

    /**
     * Check if employee has department and position
     */
    hasCompleteInfo: (employee: Employee): boolean => {
        return !!(employee.department?.name && employee.position?.name);
    },

    /**
     * Get employee status badge color
     */
    getStatusColor: (status: string): string => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'green';
            case 'inactive':
                return 'yellow';
            case 'terminated':
                return 'red';
            default:
                return 'gray';
        }
    },

    /**
     * Filter employees by search term
     */
    filterEmployees: (employees: Employee[], searchTerm: string): Employee[] => {
        if (!searchTerm.trim()) return employees;

        const lowerSearch = searchTerm.toLowerCase();
        return employees.filter(
            (employee) =>
                employee.full_name.toLowerCase().includes(lowerSearch) ||
                employee.employee_code.toLowerCase().includes(lowerSearch) ||
                employee.email?.toLowerCase().includes(lowerSearch) ||
                employee.department?.name.toLowerCase().includes(lowerSearch) ||
                employee.position?.name.toLowerCase().includes(lowerSearch),
        );
    },

    /**
     * Sort employees by name, code, or department
     */
    sortEmployees: (employees: Employee[], sortBy: 'name' | 'code' | 'department' = 'name'): Employee[] => {
        return [...employees].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.full_name.localeCompare(b.full_name);
                case 'code':
                    return a.employee_code.localeCompare(b.employee_code);
                case 'department':
                    return (a.department?.name || '').localeCompare(b.department?.name || '');
                default:
                    return 0;
            }
        });
    },
};
