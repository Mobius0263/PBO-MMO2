import { createContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';

// Add base API URL
const API_URL = 'http://localhost:8080';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to ensure full photo URL
    const ensureFullImageUrl = (userData) => {
        if (!userData) return userData;
        
        const newUserData = {...userData};
        // Fix: check if imageUrl starts with /uploads
        if (newUserData.profileImage && newUserData.profileImage.startsWith('/uploads')) {
            newUserData.profileImage = API_URL + newUserData.profileImage;
        }
        return newUserData;
    };

    useEffect(() => {
        const initAuth = () => {
            try {
                const currentUser = getCurrentUser();
                // Ensure complete image URL
                if (currentUser) {
                    const processedUser = ensureFullImageUrl(currentUser);
                    console.log("User with processed image URL:", processedUser);
                    setUser(processedUser);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const loginUser = (userData) => {
        // Ensure complete image URL before saving
        const processedUser = ensureFullImageUrl(userData);
        console.log("Processed user on login:", processedUser);
        setUser(processedUser);
        localStorage.setItem('user', JSON.stringify(processedUser));
    };

    const logoutUser = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
    };

    // Update user with new properties
    const updateUser = (newUserData) => {
        const updatedUser = {...user, ...newUserData};
        const processedUser = ensureFullImageUrl(updatedUser);
        console.log("User updated with new image URL:", processedUser);
        setUser(processedUser);
        localStorage.setItem('user', JSON.stringify(processedUser));
        return processedUser;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, loginUser, logoutUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};