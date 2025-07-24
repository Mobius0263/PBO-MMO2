import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Create meeting
export const createMeeting = async (meetingData) => {
    try {
        console.log('Creating meeting:', meetingData);
        const response = await api.post('/api/meetings', meetingData);
        console.log('Meeting created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating meeting:', error);
        throw error.response?.data || error;
    }
};

// Get all meetings
export const getMeetings = async () => {
    try {
        console.log('Fetching meetings from API');
        const response = await api.get('/api/meetings');
        console.log('Meetings fetched:', response.data);

        // Ensure we return an array
        const data = response.data || [];
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching meetings:', error);

        // Return empty array instead of throwing error
        return [];
    }
};

// Get upcoming meetings (new function)
export const getUpcomingMeetings = async () => {
    try {
        console.log('Fetching upcoming meetings from API');
        const response = await api.get('/api/meetings/upcoming');
        console.log('Upcoming meetings fetched:', response.data);

        // Ensure we return an array
        const data = response.data || [];
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching upcoming meetings:', error);

        // Return empty array instead of throwing error
        return [];
    }
};

// Get meeting by ID
export const getMeetingById = async (id) => {
    try {
        console.log(`Fetching meeting with ID: ${id}`);
        const response = await api.get(`/api/meetings/${id}`);
        console.log('Meeting fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching meeting with ID ${id}:`, error);
        throw error.response?.data || error;
    }
};