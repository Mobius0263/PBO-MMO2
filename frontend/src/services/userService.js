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

// Get all users
// Get all users
export const getUsers = async () => {
    try {
        console.log('Fetching users from:', API_URL + '/users');
        const response = await api.get('/users');
        console.log('API response:', response);
        
        // Add baseURL to profileImage if exists
        const users = response.data.map(user => {
            if (user.profileImage && !user.profileImage.startsWith('http')) {
                user.profileImage = API_URL + user.profileImage;
            }
            return user;
        });
        
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        
        // Fallback data if API fails
        console.log('Providing fallback user data');
        return [
            {
                id: '1',
                nama: 'John Doe',
                email: 'john@example.com',
                role: 'Team Leader',
                profileImage: null
            },
            // other fallback users...
        ];
    }
};

// Get user by ID
export const getUserById = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}`);
        
        // Add baseURL to profileImage if exists
        const user = response.data;
        if (user.profileImage && !user.profileImage.startsWith('http')) {
            user.profileImage = API_URL + user.profileImage;
        }
        
        return user;
    } catch (error) {
        console.error(`Error fetching user with ID ${userId}:`, error);
        throw error;
    }
};

// Update user
export const updateUser = async (userId, userData) => {
    try {
        // Try with format /api/users/:id
        try {
            const response = await api.put(`/api/users/${userId}`, userData);
            return response.data;
        } catch (error) {
            // If failed, try with format /users/:id
            const response = await api.put(`/users/${userId}`, userData);
            return response.data;
        }
    } catch (error) {
        console.error(`Error updating user with ID ${userId}:`, error);
        throw error;
    }
};

// Upload profile image
export const uploadProfileImage = async (formData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        const uploadInstance = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Uploading to:', API_URL + '/api/upload-profile-image');
        const response = await uploadInstance.post('/api/upload-profile-image', formData);
        
        console.log('Upload response:', response.data);
        
        // Ensure imageUrl is full URL
        if (response.data.imageUrl && response.data.imageUrl.startsWith('/uploads')) {
            response.data.imageUrl = API_URL + response.data.imageUrl;
            console.log('Image URL with domain:', response.data.imageUrl);
        }
        
        return response.data;
    } catch (error) {
        console.error('Error uploading profile image:', error);
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        throw error;
    }
};