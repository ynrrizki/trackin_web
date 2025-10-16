import 'leaflet/dist/leaflet.css';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import './i18n';

configureEcho({
    broadcaster: 'pusher',

    key: import.meta.env.VITE_PUSHER_APP_KEY,
    wsHost: import.meta.env.VITE_PUSHER_HOST,
    wsPort: import.meta.env.VITE_PUSHER_PORT ?? 6001,
    wssPort: import.meta.env.VITE_PUSHER_PORT ?? 6001,
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'http') === 'https',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
});

// Configure axios for Sanctum SPA authentication
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
axios.defaults.baseURL = window.location.origin;

// Request interceptor to ensure CSRF token
// Avoid recursion when requesting the CSRF cookie and deduplicate concurrent fetches
let __csrfCookiePromise: Promise<unknown> | null = null;
axios.interceptors.request.use(async (config) => {
    const url = config?.url ?? '';
    // Skip interceptor for the CSRF endpoint itself
    if (url.includes('/sanctum/csrf-cookie')) {
        return config;
    }
    // Get CSRF cookie before making requests if not present yet
    if (!document.cookie.includes('XSRF-TOKEN')) {
        if (!__csrfCookiePromise) {
            __csrfCookiePromise = axios
                .get('/sanctum/csrf-cookie')
                .catch(() => undefined)
                .finally(() => {
                    __csrfCookiePromise = null;
                });
        }
        await __csrfCookiePromise;
    }
    return config;
});

// const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const appName = 'WMI';

createInertiaApp({
    // title: (title) => (title ? `${title} - ${appName}` : appName),
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        // color: '#4B5563',
        color: '#296BF5',
    },
});

// This will set light / dark mode on load...
initializeTheme();
