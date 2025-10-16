import axios from 'axios';

// Test Sanctum authentication setup
export const testSanctumAuth = async () => {
    try {
        console.log('🔍 Testing Sanctum Authentication...');

        // Step 1: Get CSRF Cookie
        console.log('📝 Step 1: Getting CSRF Cookie...');
        await axios.get('/sanctum/csrf-cookie');
        console.log('✅ CSRF Cookie obtained');

        // Step 2: Test API without auth
        console.log('📝 Step 2: Testing public API...');
        // const publicResponse = await axios.get('/api/test');
        // console.log('✅ Public API Response:', publicResponse.data);

        // Step 3: Test current user
        console.log('📝 Step 3: Getting current user...');
        try {
            const userResponse = await axios.get('/api/user');
            console.log('✅ Current User:', userResponse.data);
        } catch (error) {
            console.log('⚠️ User endpoint failed (this might be expected):', error);
        }

        // Step 4: Test protected route
        console.log('📝 Step 4: Testing protected API...');
        const protectedResponse = await axios.get('/api/employees/without-users');
        console.log('✅ Protected API Response:', protectedResponse.data);

        return {
            success: true,
            message: 'All authentication tests passed!',
        };
    } catch (error) {
        console.error('❌ Authentication test failed:', error);

        if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;

            console.error(`📊 Status: ${status}`);
            console.error(`📝 Message: ${message}`);
            console.error(`🔍 Headers:`, error.response?.headers);

            if (status === 401) {
                console.error('🚫 Authentication required - check if user is logged in');
            } else if (status === 419) {
                console.error('🚫 CSRF Token mismatch - check CSRF configuration');
            } else if (status === 403) {
                console.error('🚫 Forbidden - check permissions');
            }
        }

        return {
            success: false,
            error: error,
        };
    }
};

// Debug helper to check current auth state
export const debugAuthState = () => {
    console.log('🔍 Current Auth Debug Info:');
    console.log('📍 Current URL:', window.location.href);
    console.log('🍪 Document Cookies:', document.cookie);
    console.log('🔧 Axios Defaults:', {
        withCredentials: axios.defaults.withCredentials,
        withXSRFToken: axios.defaults.withXSRFToken,
        baseURL: axios.defaults.baseURL,
    });
};
