import { Employee } from '@/types';
import { Role } from '@/types/role-permission';
import axios from 'axios';

export interface BaseInvitationData {
    role_ids: number[];
    send_invitation: boolean;
    custom_message: string;
}

export interface RegularUserInvitationData extends BaseInvitationData {
    name: string;
    email: string;
    password?: string;
    generate_password: boolean;
}

export interface EmployeeInvitationData extends BaseInvitationData {
    employee_id: number;
    name: string;
    email: string;
    generate_password: boolean;
}

export interface BulkEmployeeInvitationData extends BaseInvitationData {
    employee_ids: number[];
    employees: Array<{
        id: number;
        name: string;
        email: string;
    }>;
    generate_password: boolean;
}

export interface InvitationResponse {
    message: string;
    user?: {
        id: number;
        name: string;
        email: string;
        roles?: Role[];
        permissions?: string[];
    };
    password?: string;
    created_users?: number;
    total_employees?: number;
    users?: Array<{
        user: {
            id: number;
            name: string;
            email: string;
            roles?: Role[];
            permissions?: string[];
        };
        password: string;
        employee: Employee;
    }>;
    errors?: string[];
}

/**
 * User invitation service for handling different types of user invitations
 */
export class UserInvitationService {
    private static instance: UserInvitationService;
    private baseUrl = '/api';

    public static getInstance(): UserInvitationService {
        if (!UserInvitationService.instance) {
            UserInvitationService.instance = new UserInvitationService();
        }
        return UserInvitationService.instance;
    }

    /**
     * Create a regular user account
     */
    async inviteRegularUser(data: RegularUserInvitationData): Promise<InvitationResponse> {
        const response = await axios.post(`${this.baseUrl}/users`, data);
        return response.data;
    }

    /**
     * Invite employee as user
     */
    async inviteEmployeeAsUser(data: EmployeeInvitationData): Promise<InvitationResponse> {
        const response = await axios.post(`${this.baseUrl}/employees/invite-user`, data);
        return response.data;
    }

    /**
     * Bulk invite employees as users
     */
    async bulkInviteEmployees(data: BulkEmployeeInvitationData): Promise<InvitationResponse> {
        const response = await axios.post(`${this.baseUrl}/employees/bulk-invite-users`, data);
        return response.data;
    }

    /**
     * Validate invitation data before submission
     */
    validateInvitationData(data: BaseInvitationData, type: 'regular' | 'employee' | 'bulk'): string[] {
        const errors: string[] = [];

        // Common validations
        if (!data.role_ids || data.role_ids.length === 0) {
            errors.push('At least one role must be selected');
        }

        // Type-specific validations
        if (type === 'regular') {
            const regularData = data as RegularUserInvitationData;
            if (!regularData.name?.trim()) {
                errors.push('Name is required');
            }
            if (!regularData.email?.trim()) {
                errors.push('Email is required');
            }
            if (!regularData.generate_password && !regularData.password?.trim()) {
                errors.push('Password is required when not auto-generating');
            }
        }

        if (type === 'employee') {
            const employeeData = data as EmployeeInvitationData;
            if (!employeeData.employee_id) {
                errors.push('Employee must be selected');
            }
        }

        if (type === 'bulk') {
            const bulkData = data as BulkEmployeeInvitationData;
            if (!bulkData.employee_ids || bulkData.employee_ids.length === 0) {
                errors.push('At least one employee must be selected');
            }
        }

        return errors;
    }

    /**
     * Prepare employee data for invitation
     */
    prepareEmployeeInvitationData(employee: Employee, baseData: BaseInvitationData): EmployeeInvitationData {
        return {
            ...baseData,
            employee_id: employee.id,
            name: employee.full_name,
            email: employee.email || '',
            generate_password: true,
        };
    }

    /**
     * Prepare bulk employee data for invitation
     */
    prepareBulkInvitationData(employees: Employee[], baseData: BaseInvitationData): BulkEmployeeInvitationData {
        return {
            ...baseData,
            employee_ids: employees.map((emp) => emp.id),
            employees: employees.map((emp) => ({
                id: emp.id,
                name: emp.full_name,
                email: emp.email || '',
            })),
            generate_password: true,
        };
    }
}

/**
 * Hook-like function for user invitation operations
 */
export const useUserInvitation = () => {
    const service = UserInvitationService.getInstance();

    return {
        inviteRegularUser: service.inviteRegularUser.bind(service),
        inviteEmployeeAsUser: service.inviteEmployeeAsUser.bind(service),
        bulkInviteEmployees: service.bulkInviteEmployees.bind(service),
        validateInvitationData: service.validateInvitationData.bind(service),
        prepareEmployeeInvitationData: service.prepareEmployeeInvitationData.bind(service),
        prepareBulkInvitationData: service.prepareBulkInvitationData.bind(service),
    };
};

/**
 * Utility functions for invitation operations
 */
export const invitationUtils = {
    /**
     * Generate invitation summary text
     */
    getInvitationSummary: (type: 'regular' | 'employee' | 'bulk', count: number = 1): string => {
        switch (type) {
            case 'regular':
                return 'Create new user account';
            case 'employee':
                return 'Invite employee as user';
            case 'bulk':
                return `Invite ${count} employees as users`;
            default:
                return 'Send invitation';
        }
    },

    /**
     * Get loading message based on invitation type
     */
    getLoadingMessage: (type: 'regular' | 'employee' | 'bulk', withEmail: boolean): string => {
        const action = withEmail ? 'Sending invitation' : 'Creating user';

        switch (type) {
            case 'regular':
                return `${action}...`;
            case 'employee':
                return `${action} for employee...`;
            case 'bulk':
                return `${action}s for employees...`;
            default:
                return `${action}...`;
        }
    },

    /**
     * Get success message based on invitation type
     */
    getSuccessMessage: (type: 'regular' | 'employee' | 'bulk', count: number = 1): string => {
        switch (type) {
            case 'regular':
                return 'User berhasil dibuat dan invitation dikirim';
            case 'employee':
                return 'Employee berhasil diundang sebagai user';
            case 'bulk':
                return `${count} employees berhasil diundang sebagai user`;
            default:
                return 'Invitation sent successfully';
        }
    },

    /**
     * Validate email format
     */
    isValidEmail: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Get role display names
     */
    getRoleNames: (roles: Role[], roleIds: number[]): string => {
        const selectedRoles = roles.filter((role) => roleIds.includes(role.id));
        return selectedRoles.map((role) => role.name).join(', ');
    },

    /**
     * Calculate invitation cost or limitations
     */
    getInvitationLimits: (
        type: 'regular' | 'employee' | 'bulk',
        count: number = 1,
    ): {
        isWithinLimit: boolean;
        message?: string;
    } => {
        // Example business rules - adjust based on requirements
        if (type === 'bulk' && count > 50) {
            return {
                isWithinLimit: false,
                message: 'Bulk invitation limited to 50 employees at once',
            };
        }

        return {
            isWithinLimit: true,
        };
    },
};
