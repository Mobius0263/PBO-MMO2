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
// This function should be already implemented, but ensure it's working correctly
export const getUsers = async () => {
    try {
        console.log('Fetching users from:', API_URL + '/users');
        const response = await api.get('/users');
        console.log('API response:', response);

        // Ensure we have valid data
        const data = response.data || [];

        // Add baseURL to profileImage if exists
        const users = Array.isArray(data) ? data.map(user => {
            if (user && user.profileImage && !user.profileImage.startsWith('http')) {
                user.profileImage = API_URL + user.profileImage;
            }
            return user;
        }) : [];

        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        // Return an empty array to avoid errors
        return [];
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
// Update the updateUser function to ensure all fields are sent properly

export const updateUser = async (userId, userData) => {
    try {
        console.log('Updating user with data:', userData);

        // Make sure we're sending all required fields, including role
        const dataToSend = {
            ...userData,
            role: userData.role || 'Team Member' // Ensure role is always set
        };

        // Try with format /api/users/:id
        try {
            const response = await api.put(`/api/users/${userId}`, dataToSend);
            console.log('Update response:', response.data);
            return response.data;
        } catch (error) {
            // If failed, try with format /users/:id
            const response = await api.put(`/users/${userId}`, dataToSend);
            console.log('Update response (fallback):', response.data);
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

// Delete user
export const deleteUser = async (userId) => {
    try {
        const token = localStorage.getItem('token');

        const response = await api.delete(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};