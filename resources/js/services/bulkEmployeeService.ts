import axios from 'axios';

// Set up axios defaults for CSRF protection
axios.defaults.headers.common['Accept'] = 'application/json';
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string[]>;
}

interface BulkImportResult {
    success_count: number;
    error_count: number;
    total_processed: number;
    processed_data: Array<{
        row: number;
        employee_id?: number;
        name?: string;
        status: 'success' | 'error';
    }>;
    errors?: Array<{
        row: number;
        error: string;
        data: Record<string, string | number | boolean>;
    }>;
}

interface MasterDataItem {
    id: number;
    name: string;
}

interface MasterData {
    positions: MasterDataItem[];
    position_levels: MasterDataItem[];
    departments: MasterDataItem[];
    employment_statuses: MasterDataItem[];
    employee_types: MasterDataItem[];
    outsourcing_fields: MasterDataItem[];
}

class BulkEmployeeService {
    private baseURL = '/api/hrms/employees/bulk';

    /**
     * Download Excel template for bulk employee import
     */
    async downloadTemplate(): Promise<Blob> {
        try {
            const response = await axios.get(`${this.baseURL}/template`, {
                responseType: 'blob',
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to download template');
            }
            throw error;
        }
    }

    /**
     * Get master data for reference in bulk import
     */
    async getMasterData(): Promise<MasterData> {
        try {
            const response = await axios.get(`${this.baseURL}/master-data`);
            const result = response.data;

            if (!result.success) {
                throw new Error(result.message || 'Failed to load master data');
            }

            return result.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to load master data');
            }
            throw error;
        }
    }

    /**
     * Upload and import Excel file for bulk employee creation
     */
    async bulkImport(file: File): Promise<{
        success: boolean;
        message: string;
        data: BulkImportResult;
        status: number;
    }> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(`${this.baseURL}/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return {
                success: response.data.success,
                message: response.data.message,
                data: response.data.data,
                status: response.status,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorData = error.response?.data;
                if (error.response?.status === 207) {
                    // Partial success
                    return {
                        success: errorData.success,
                        message: errorData.message,
                        data: errorData.data,
                        status: error.response.status,
                    };
                }
                throw new Error(errorData?.message || 'Import failed');
            }
            throw error;
        }
    }

    /**
     * Validate file before upload
     */
    validateFile(file: File): { valid: boolean; error?: string } {
        // Check file type
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Please select a valid Excel file (.xlsx or .xls)',
            };
        }

        // Check file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return {
                valid: false,
                error: 'File size must be less than 10MB',
            };
        }

        return { valid: true };
    }

    /**
     * Get file download name from Content-Disposition header
     */
    getFilenameFromResponse(response: { headers?: Record<string, string> }): string {
        const contentDisposition = response.headers?.['content-disposition'];
        let filename = 'bulk_employee_template.xlsx';

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        return filename;
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

// Export singleton instance
const bulkEmployeeService = new BulkEmployeeService();
export default bulkEmployeeService;

// Export types for use in components
export type { ApiResponse, BulkImportResult, MasterData, MasterDataItem };
