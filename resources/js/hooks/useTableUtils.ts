import { useCallback, useState } from 'react';

interface UseLoadingStateOptions {
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export function useLoadingState() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (action: () => Promise<void> | void, options?: UseLoadingStateOptions) => {
        setIsLoading(true);
        setError(null);

        try {
            await action();
            options?.onSuccess?.();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            options?.onError?.(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        execute,
        setError,
    };
}

interface UsePaginationOptions {
    initialPage?: number;
    initialPerPage?: number;
}

export function usePagination({ initialPage = 1, initialPerPage = 10 }: UsePaginationOptions = {}) {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [perPage, setPerPage] = useState(initialPerPage);
    const [searchTerm, setSearchTerm] = useState('');

    const paginateData = useCallback(
        <T>(data: T[]) => {
            const filtered = data.filter((item: any) => {
                if (!searchTerm) return true;

                const searchableFields = ['name', 'email', 'title'];
                return searchableFields.some((field) => item[field]?.toLowerCase().includes(searchTerm.toLowerCase()));
            });

            const startIndex = (currentPage - 1) * perPage;
            const endIndex = startIndex + perPage;
            const paginatedData = filtered.slice(startIndex, endIndex);

            return {
                data: paginatedData,
                total: filtered.length,
                totalPages: Math.ceil(filtered.length / perPage),
                currentPage,
                perPage,
                from: startIndex + 1,
                to: Math.min(endIndex, filtered.length),
            };
        },
        [currentPage, perPage, searchTerm],
    );

    const goToPage = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const changePerPage = useCallback((newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    }, []);

    return {
        currentPage,
        perPage,
        searchTerm,
        setSearchTerm,
        paginateData,
        goToPage,
        changePerPage,
    };
}
