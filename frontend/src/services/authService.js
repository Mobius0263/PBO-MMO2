import axios from 'axios';

const API_URL = 'http://localhost:8080';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add response interceptor to handle errors globally
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response || error);
        
        const errorMsg = 
            error.response?.data?.error || 
            error.message || 
            'Something went wrong';
            
        return Promise.reject(new Error(errorMsg));
    }
);

export const register = async (userData) => {
    try {
        console.log('Registering user:', userData);
        
        // Ubah URL menjadi /register (tanpa /auth prefix)
        const response = await api.post('/register', userData);
        
        console.log('Registration response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Registration error details:', error);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            throw new Error(error.response.data.error || 'Server error');
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
            throw new Error('No response from server. Please check if backend is running.');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Request setup error:', error.message);
            throw error;
        }
    }
};

export const login = async (credentials) => {
    try {
        console.log('Logging in user:', credentials.email);
        
        // Ubah URL menjadi /login (tanpa /auth prefix)
        const response = await api.post('/login', credentials);
        
        // Save token and user data to local storage
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};