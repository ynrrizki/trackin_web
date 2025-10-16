import axios from 'axios';

// Set up axios defaults for CSRF protection
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

class AttendanceService {
    private baseURL = '/api/hrms/attendance';

    /**
     * Export attendance data to Excel
     */
    async exportAttendance({ params }: { params?: Record<string, string | number | boolean> } = {}): Promise<Blob> {
        try {
            const response = await axios.get(`${this.baseURL}/export`, {
                params,
                responseType: 'blob',
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Failed to export attendance data');
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

export const attendanceService = new AttendanceService();
export default attendanceService;
