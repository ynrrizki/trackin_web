import { router } from '@inertiajs/react';
import axios from 'axios';

// Set up axios defaults for CSRF protection
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

interface ExportParams {
    q?: string;
    category_id?: string;
    severity?: string;
    status?: string;
    priority?: string;
    from?: string;
    to?: string;
}

interface UpdateStatusParams {
    status: string;
    notes?: string;
}

interface UpdatePriorityParams {
    priority: string;
}

interface AddFollowUpParams {
    description: string;
    created_by?: string;
}

interface AssignIncidentParams {
    assigned_to_employee_id: number;
}

interface IncidentDetail {
    id: number;
    category?: { id: number; name: string };
    incident_at?: string;
    location?: string;
    lat?: number;
    long?: number;
    related_name?: string;
    related_status?: string;
    severity?: string;
    priority?: string;
    status?: string;
    status_label?: string;
    priority_label?: string;
    description?: string;
    handling_steps?: string;
    follow_up_actions?: Array<{
        id: string;
        description: string;
        created_by: string;
        created_at: string;
    }>;
    resolution_notes?: string;
    resolved_at?: string;
    photo_url?: string;
    reporter?: { id: number; name: string };
    assigned_to?: { id: number; name: string };
}

interface ApiResponse<T = unknown> {
    message: string;
    data?: T;
}

interface IncidentStatistics {
    total: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_severity: Record<string, number>;
    recent_count: number;
}

interface IncidentsListResponse {
    data: IncidentDetail[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

// Axios instance sudah dikonfigurasi dengan CSRF token di atas

export const incidentService = {
    // Get incidents with pagination and filters
    async getIncidents(params?: Record<string, string | number>): Promise<IncidentsListResponse> {
        try {
            const response = await axios.get('/api/security-ops/incidents', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching incidents:', error);
            throw error;
        }
    },

    // Export incidents to Excel
    async exportIncidents(params: ExportParams): Promise<void> {
        try {
            const response = await axios.get('/api/security-ops/incidents/export', {
                params,
                responseType: 'blob',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Get filename from Content-Disposition header if available
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'laporan-insiden.xlsx';

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    },

    // Get incident detail
    async getIncident(incidentId: number): Promise<IncidentDetail> {
        try {
            const response = await axios.get(`/api/security-ops/incidents/${incidentId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching incident:', error);
            throw error;
        }
    },

    // Update incident status
    async updateStatus(incidentId: number, params: UpdateStatusParams): Promise<void> {
        try {
            await axios.patch(`/api/security-ops/incidents/${incidentId}/status`, params);

            // Refresh the page data
            router.reload({ only: ['incidents'] });
        } catch (error) {
            console.error('Error updating incident status:', error);
            throw error;
        }
    },

    // Update incident priority
    async updatePriority(incidentId: number, params: UpdatePriorityParams): Promise<void> {
        try {
            await axios.patch(`/api/security-ops/incidents/${incidentId}/priority`, params);

            // Refresh the page data
            router.reload({ only: ['incidents'] });
        } catch (error) {
            console.error('Error updating incident priority:', error);
            throw error;
        }
    },

    // Add follow-up action
    async addFollowUp(incidentId: number, params: AddFollowUpParams): Promise<ApiResponse<IncidentDetail>> {
        try {
            const response = await axios.post(`/api/security-ops/incidents/${incidentId}/follow-up`, params);

            // Refresh the page data
            router.reload({ only: ['incidents'] });

            return response.data;
        } catch (error) {
            console.error('Error adding follow-up action:', error);
            throw error;
        }
    },

    // Assign incident to employee
    async assignIncident(incidentId: number, params: AssignIncidentParams): Promise<void> {
        try {
            await axios.patch(`/api/security-ops/incidents/${incidentId}/assign`, params);

            // Refresh the page data
            router.reload({ only: ['incidents'] });
        } catch (error) {
            console.error('Error assigning incident:', error);
            throw error;
        }
    }, // Create new incident
    async createIncident(formData: FormData): Promise<ApiResponse<IncidentDetail>> {
        try {
            const response = await axios.post('/api/security-ops/incidents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating incident:', error);
            throw error;
        }
    },

    // Update incident
    async updateIncident(incidentId: number, formData: FormData): Promise<ApiResponse<IncidentDetail>> {
        try {
            // Use POST with _method override for file uploads
            formData.append('_method', 'PUT');
            const response = await axios.post(`/api/security-ops/incidents/${incidentId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating incident:', error);
            throw error;
        }
    },

    // Delete incident
    async deleteIncident(incidentId: number): Promise<void> {
        try {
            await axios.delete(`/api/security-ops/incidents/${incidentId}`);

            // Refresh the page data
            router.reload({ only: ['incidents'] });
        } catch (error) {
            console.error('Error deleting incident:', error);
            throw error;
        }
    },

    // Get incident categories
    async getCategories(): Promise<Array<{ id: number; name: string }>> {
        try {
            const response = await axios.get('/api/security-ops/incidents/categories');
            return response.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    },

    // Get incident statistics
    async getStatistics(): Promise<IncidentStatistics> {
        try {
            const response = await axios.get('/api/security-ops/incidents/statistics');
            return response.data;
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    },
};
