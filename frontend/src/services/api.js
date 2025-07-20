import axios from 'axios';

// Change URL according to your backend configuration
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Add timeout to avoid waiting too long
    timeout: 5000
});

// Intercept requests to add authentication token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;