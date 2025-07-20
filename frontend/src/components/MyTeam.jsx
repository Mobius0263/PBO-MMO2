import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { getUsers } from '../services/userService';
import '../styles/MyTeam.css';

function MyTeam() {
    const { user } = useContext(AuthContext);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All Roles');

    const API_URL = 'http://localhost:8080';
    
    // Helper function to get name initials
    const getInitial = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };
    
    // Fetch users from database
    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                setLoading(true);
                console.log("Fetching team members...");
                const response = await getUsers();
                console.log("Raw response:", response);

                // Format response to handle image URLs
                const formattedMembers = response.map(member => {
                    console.log("Processing member:", member.nama, "Profile image:", member.profileImage);
                    
                    // Ensure profileImage has full URL if exists
                    if (member.profileImage) {
                        if (!member.profileImage.startsWith('http')) {
                            // Ensure no duplicate slashes
                            const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
                            const imagePath = member.profileImage.startsWith('/') ? member.profileImage : '/' + member.profileImage;
                            
                            member.profileImage = `${baseUrl}${imagePath}`;
                        }
                        console.log("Formatted image URL:", member.profileImage);
                    } else {
                        console.log("No profile image for this member");
                    }
                    
                    return member;
                });

                console.log("Formatted members:", formattedMembers);
                setTeamMembers(formattedMembers);
                setError(null);
            } catch (err) {
                console.error('Error fetching team members:', err);
                setError('Failed to load team members. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, []);

    // Get unique roles from team members
    const roles = ['All Roles', ...new Set(teamMembers.map(member => member.role || 'Team Member').filter(Boolean))];

    // Get role icon based on role
    const getRoleIcon = (role) => {
        const roleIcons = {
            'Team Leader': 'fa-user-tie',
            'Developer': 'fa-code',
            'Designer': 'fa-paint-brush',
            'Product Manager': 'fa-clipboard-list',
            'QA Engineer': 'fa-bug',
            'Team Member': 'fa-user'
        };
        return roleIcons[role] || 'fa-user';
    };

    // Filter the team members based on search and filters
    const filteredMembers = teamMembers.filter(member => {
        const matchesSearch =
            member.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = selectedRole === 'All Roles' || member.role === selectedRole;

        return matchesSearch && matchesRole;
    });

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
                <div className="dashboard-header">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search team members..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="header-actions">
                        <button className="btn-add-member">
                            <i className="fas fa-user-plus"></i> Add Member
                        </button>
                        <div className="notification-icon">
                            <i className="icon-bell"></i>
                            <span className="notification-badge">1</span>
                        </div>
                    </div>
                </div>

                <div className="my-team-content">
                    <div className="my-team-header">
                        <h2>My Team</h2>
                        <p>Manage and collaborate with your team members</p>
                    </div>

                    <div className="team-filters">
                        <div className="filter-group">
                            <label>Role:</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="filter-select"
                            >
                                {roles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="team-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading team members...</p>
                        </div>
                    ) : error ? (
                        <div className="team-error">
                            <i className="fas fa-exclamation-circle"></i>
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="team-members-grid">
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map(member => (
                                    <div key={member.id || member._id} className="member-card">
                                        <div className="member-avatar">
                                            {/* Condition to display photo or initials */}
                                            {member.profileImage ? (
                                                <img
                                                    src={`${member.profileImage}?t=${Date.now()}`}
                                                    alt={`${member.nama}'s avatar`}
                                                    className="member-avatar-image"
                                                    onError={(e) => {
                                                        console.error(`Failed to load image for ${member.nama}`);
                                                        e.target.style.display = 'none';
                                                        e.target.parentNode.innerHTML = `<div class="member-avatar-placeholder">${getInitial(member.nama)}</div>`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="member-avatar-placeholder">
                                                    {getInitial(member.nama)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="member-info">
                                            <h3>{member.nama || 'Unknown User'}</h3>
                                            <div className="member-role">
                                                <i className={`fas ${getRoleIcon(member.role)}`}></i>
                                                <span>{member.role || 'Team Member'}</span>
                                            </div>
                                            <div className="member-email">{member.email}</div>
                                            {member.bio && (
                                                <div className="member-bio">{member.bio}</div>
                                            )}
                                        </div>
                                        <div className="member-actions">
                                            <button className="action-button" title="Message">
                                                <i className="fas fa-comment"></i>
                                            </button>
                                            <button className="action-button" title="Schedule Meeting">
                                                <i className="fas fa-calendar-plus"></i>
                                            </button>
                                            <button className="action-button" title="View Profile">
                                                <i className="fas fa-user"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-results">
                                    <i className="fas fa-search"></i>
                                    <p>No team members found matching your search criteria.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="team-stats">
                        <div className="stats-card">
                            <div className="stats-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <div className="stats-info">
                                <h3>Team Size</h3>
                                <div className="stats-value">{teamMembers.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyTeam;