import { Employee as AppEmployee } from '@/types';
import { EmployeeFormType } from '@/types/employee';
import axios from 'axios';

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string[]>;
}

class EmployeeService {
    private baseURL = '/api/hrms/employees';

    async createEmployee(payload: EmployeeFormType): Promise<ApiResponse<{ employee: AppEmployee }>> {
        try {
            const response = await axios.post(this.baseURL, payload);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) return error.response.data;
            throw error;
        }
    }

    async updateEmployee(id: number | string, payload: Partial<EmployeeFormType>): Promise<ApiResponse<{ employee: AppEmployee }>> {
        try {
            const response = await axios.patch(`${this.baseURL}/${id}`, payload);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) return error.response.data;
            throw error;
        }
    }

    async updateEmployeePersonal(id: number | string, payload: Partial<EmployeeFormType>): Promise<ApiResponse<{ employee: AppEmployee }>> {
        try {
            const response = await axios.patch(`${this.baseURL}/${id}/sections/personal`, payload);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) return error.response.data;
            throw error;
        }
    }

    async updateEmployeeEmployment(id: number | string, payload: Partial<EmployeeFormType>): Promise<ApiResponse<{ employee: AppEmployee }>> {
        try {
            const response = await axios.patch(`${this.baseURL}/${id}/sections/employment`, payload);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) return error.response.data;
            throw error;
        }
    }

    async updateEmployeePayroll(id: number | string, payload: Partial<EmployeeFormType>): Promise<ApiResponse<{ employee: AppEmployee }>> {
        try {
            const response = await axios.patch(`${this.baseURL}/${id}/sections/payroll`, payload);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) return error.response.data;
            throw error;
        }
    }

    async updateEmployeeSection(
        id: number | string,
        section: string,
        payload: Record<string, unknown>,
    ): Promise<ApiResponse<{ employee: AppEmployee }>> {
        try {
            const response = await axios.patch(`${this.baseURL}/${id}/sections/${section}`, payload);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) return error.response.data;
            throw error;
        }
    }

    async exportEmployees({ params }: { params?: Record<string, string | number | boolean> } = {}): Promise<Blob> {
        try {
            const response = await axios.get('/api/hrms/employees/export', {
                params,
                responseType: 'blob',
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to export employees');
            }
            throw error;
        }
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}

export const employeeService = new EmployeeService();
export default employeeService;
