import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, isAdmin } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { updateUser, uploadProfileImage } from '../services/userService';
import '../styles/Settings.css';

function Settings() {
    const { user, loginUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Form fields
    const [fullName, setFullName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [bio, setBio] = useState('');

    // Password fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Image upload
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // Load user data on component mount
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        setFullName(user.nama || '');
        setDisplayName(user.nama?.split(' ')[0] || '');
        setEmail(user.email || '');
        setRole(user.role || 'Team Member');
        setBio(user.bio || '');
        setPreviewUrl(user.profileImage || '');
    }, [user, navigate]);

    const handleImageChange = (e) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const file = e.target.files[0];
        console.log("Selected file:", file);

        // Validate file type and size
        if (file.size > 5000000) { // 5MB max
            setMessage({ text: 'File too large (max 5MB)', type: 'error' });
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setMessage({ text: 'Invalid file type. Only JPG, PNG and GIF allowed', type: 'error' });
            return;
        }

        setImageFile(file);

        // Create preview URL
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    };

    // filepath: d:\KULIAH\SEMESTER 4\Rekayasa Perangkat Lunak\code\new 16-6-2025\frontend\src\components\Settings.jsx

    // Inside the handleProfileUpdate function

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            console.log("Starting profile update with data:", {
                fullName,
                email,
                role, // Make sure role is included
                bio,
                imageFile: imageFile ? imageFile.name : 'No file'
            });

            // First upload image if there's a new one
            let imageUrl = user.profileImage;

            if (imageFile) {
                console.log("Uploading image...", imageFile);
                const formData = new FormData();
                formData.append('image', imageFile);

                try {
                    const uploadResult = await uploadProfileImage(formData);
                    console.log("Image upload result:", uploadResult);

                    // Ensure imageUrl is complete with domain
                    imageUrl = uploadResult.imageUrl;
                    if (imageUrl && imageUrl.startsWith('/uploads')) {
                        imageUrl = 'http://localhost:8080' + imageUrl;
                    }
                } catch (uploadError) {
                    console.error("Image upload failed:", uploadError);
                    throw new Error("Failed to upload profile image: " + (uploadError.response?.data?.error || uploadError.message));
                }
            }

            // Update user data - Make sure role is included even if unchanged
            const updatedData = {
                nama: fullName,
                email,
                role: role, // Include role explicitly
                bio,
                profileImage: imageUrl
            };

            console.log("Updating user with data:", updatedData);

            try {
                const result = await updateUser(user.id, updatedData);
                console.log("Update result:", result);

                // Update context with the new data
                // This is important to refresh the UI with the new role
                const updatedUserData = {
                    ...user,
                    ...updatedData
                };
                loginUser(updatedUserData);

                setMessage({ text: 'Profile updated successfully', type: 'success' });

                // Clear any file selection
                setImageFile(null);

            } catch (updateError) {
                console.error("Update failed:", updateError);
                throw new Error("Failed to update profile: " + (updateError.response?.data?.error || updateError.message));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ text: error.message || 'Failed to update profile', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage({ text: 'New passwords do not match', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const result = await updateUser(user.id, {
                currentPassword,
                newPassword
            });

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setMessage({ text: 'Password updated successfully', type: 'success' });
        } catch (error) {
            console.error('Error updating password:', error);
            setMessage({ text: error.response?.data?.error || 'Failed to update password', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-main">
            <Sidebar />

            <div className="dashboard-content">
                <div className="settings-header">
                    <h2>Settings</h2>
                    <p>Manage your account settings</p>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="settings-container">
                    {/* Account Settings */}
                    <div className="settings-section">
                        <h3>Account Settings</h3>
                        <p className="settings-description">Manage your personal account information</p>

                        <form className="settings-form" onSubmit={handleProfileUpdate}>
                            <div className="profile-image-section">
                                <div className="profile-image-container">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Profile"
                                            className="profile-image-preview"
                                        />
                                    ) : (
                                        <div className="profile-image-placeholder">
                                            {fullName.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                <div className="profile-image-actions">
                                    <label className="btn-upload">
                                        <i className="fas fa-upload"></i> Upload
                                        <input
                                            type="file"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                        />
                                    </label>

                                    {previewUrl && (
                                        <button
                                            type="button"
                                            className="btn-remove"
                                            onClick={() => {
                                                setPreviewUrl('');
                                                setImageFile(null);
                                            }}
                                        >
                                            <i className="fas fa-trash"></i> Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="fullName">Full Name</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="displayName">Display Name</label>
                                    <input
                                        type="text"
                                        id="displayName"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="role">Role</label>
                                    <select
                                        id="role"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        disabled={!isAdmin(user)} // Disable for non-admin users
                                    >
                                        {isAdmin(user) && <option value="Admin">Admin</option>}
                                        <option value="Team Leader">Team Leader</option>
                                        <option value="Team Member">Team Member</option>
                                        <option value="Developer">Developer</option>
                                        <option value="Designer">Designer</option>
                                        <option value="Product Manager">Product Manager</option>
                                    </select>
                                    {!isAdmin(user) && (
                                        <div className="form-field-hint">
                                            <i className="fas fa-info-circle"></i> Only administrators can change roles.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label htmlFor="bio">Bio</label>
                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={4}
                                    placeholder="Tell us about yourself"
                                ></textarea>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-save" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Password & Security */}
                    <div className="settings-section">
                        <h3>Password & Security</h3>
                        <p className="settings-description">Update your password to keep your account secure</p>

                        <form className="settings-form" onSubmit={handlePasswordUpdate}>
                            <div className="form-group">
                                <label htmlFor="currentPassword">Current Password</label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-update" disabled={loading}>
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;