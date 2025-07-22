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
        return response.data;
    } catch (error) {
        console.error('Error fetching meetings:', error);
        throw error.response?.data || error;
    }
};

// Get today's meetings
export const getTodayMeetings = async () => {
    try {
        console.log('Fetching today\'s meetings from API');
        const response = await api.get('/api/meetings/today');
        console.log('Today\'s meetings fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching today\'s meetings:', error);
        throw error.response?.data || error;
    }
};