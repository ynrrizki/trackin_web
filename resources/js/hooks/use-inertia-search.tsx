import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

export function useInertiaSearch() {
    const params = new URLSearchParams(window.location.search);
    const [search, setSearch] = useState(params.get('search') || '');
    const [value] = useDebounce(search, 500);

    // This effect can be used to trigger a search or filter action
    useEffect(() => {
        // Merge current query params, only change the `search` key
        const currentParams = new URLSearchParams(window.location.search);
        if (value && value.length > 0) {
            currentParams.set('search', value);
        } else {
            currentParams.delete('search');
        }

        // Convert URLSearchParams to plain object for Inertia
        const query: Record<string, string> = {};
        currentParams.forEach((v, k) => {
            if (v !== undefined && v !== null) query[k] = v;
        });

        router.get(window.location.pathname, query, {
            preserveState: true,
            replace: true,
        });
    }, [value]);

    return {
        search,
        value,
        setSearch,
    };
}
