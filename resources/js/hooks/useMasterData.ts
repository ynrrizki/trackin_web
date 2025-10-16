import { EmployeeMasterData, MasterDataResponse } from '@/types/masterData';
import axios from 'axios';
import { useEffect, useState } from 'react';

export const useMasterData = () => {
    const [masterData, setMasterData] = useState<EmployeeMasterData>({
        positions: [],
        position_levels: [],
        departments: [],
        employment_statuses: [],
        employee_types: [],
        outsourcing_fields: [],
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMasterData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Menggunakan web route untuk Inertia.js (session-based auth)
            const response = await axios.get<MasterDataResponse>('/master-data/employee-form', {
                headers: {
                    // 'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.success) {
                setMasterData(response.data.data);
            } else {
                setError(response.data.message || 'Failed to fetch master data');
            }
        } catch (err) {
            console.error('Error fetching master data:', err);
            const errorMessage = axios.isAxiosError(err) ? err.response?.data?.message || err.message : 'Failed to fetch master data';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    const refetch = () => {
        fetchMasterData();
    };

    return {
        masterData,
        loading,
        error,
        refetch,
    };
};
