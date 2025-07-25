import { useState, useEffect, useContext } from 'react';
import { AuthContext, isAdmin } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { getUsers, deleteUser, updateUser } from '../services/userService';
import '../styles/MyTeam.css';

function MyTeam() {
    const { user } = useContext(AuthContext);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('All Roles');
    const [showManageModal, setShowManageModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [newRole, setNewRole] = useState('');

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

    const openManageMember = (member) => {
        setSelectedMember(member);
        setNewRole(member.role || 'Team Member');
        setShowManageModal(true);
    };

    const closeManageMember = () => {
        setSelectedMember(null);
        setShowManageModal(false);  // Changed from setShowManageMember to setShowManageModal
    };

    const handleRoleChange = async () => {
        if (!selectedMember) return;

        try {
            const updatedMember = await updateUser(selectedMember.id, { role: newRole });

            // Update the local state
            setTeamMembers(prevMembers =>
                prevMembers.map(member =>
                    member.id === selectedMember.id ? { ...member, role: newRole } : member
                )
            );

            // Close the modal
            closeManageMember();
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role. Please try again.');
        }
    };

    const handleDeleteMember = async () => {
        if (!selectedMember) return;

        if (window.confirm(`Are you sure you want to delete ${selectedMember.nama}?`)) {
            try {
                await deleteUser(selectedMember.id);

                // Update the local state
                setTeamMembers(prevMembers =>
                    prevMembers.filter(member => member.id !== selectedMember.id)
                );

                // Close the modal
                closeManageMember();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user. Please try again.');
            }
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
                        {isAdmin(user) && (
                            <button
                                className="btn-add-member"
                                onClick={() => {
                                    setSelectedMember(null); // Reset selected member to avoid issues
                                    setShowManageModal(true);
                                }}
                            >
                                <i className="fas fa-user-cog"></i> Manage Member
                            </button>
                        )}
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
                                    <div
                                        key={member.id || member._id}
                                        className="member-card"
                                        onClick={() => openManageMember(member)}
                                        style={{ cursor: 'pointer' }}
                                    >
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

            {/* Manage Member Modal */}
            {showManageModal && (
                <div className="modal-overlay" onClick={closeManageMember}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Manage Team Member</h3>
                            <button
                                className="btn-close"
                                onClick={closeManageMember}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="modal-body">
                            {selectedMember ? (
                                <div className="manage-member-content">
                                    <div className="member-profile">
                                        <div className="member-avatar large">
                                            {selectedMember.profileImage ? (
                                                <img
                                                    src={selectedMember.profileImage}
                                                    alt={`${selectedMember.nama}'s avatar`}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentNode.innerHTML = `<div class="member-avatar-placeholder large">${getInitial(selectedMember.nama)}</div>`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="member-avatar-placeholder large">
                                                    {getInitial(selectedMember.nama)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="member-details">
                                            <h4>{selectedMember.nama || 'Unknown User'}</h4>
                                            <p>{selectedMember.email}</p>
                                            <p className="current-role">Current role: {selectedMember.role || 'Team Member'}</p>
                                        </div>
                                    </div>

                                    {isAdmin(user) && (
                                        <div className="manage-actions">
                                            <div className="form-group">
                                                <label>Change Role</label>
                                                <select
                                                    value={newRole}
                                                    onChange={(e) => setNewRole(e.target.value)}
                                                >
                                                    <option value="Team Leader">Team Leader</option>
                                                    <option value="Team Member">Team Member</option>
                                                    <option value="Developer">Developer</option>
                                                    <option value="Designer">Designer</option>
                                                    <option value="Product Manager">Product Manager</option>
                                                    <option value="QA Engineer">QA Engineer</option>
                                                    <option value="Admin">Admin</option>
                                                </select>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-save"
                                                        onClick={handleRoleChange}
                                                    >
                                                        Update Role
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="danger-zone">
                                                <h4>Danger Zone</h4>
                                                <p>This action cannot be undone.</p>
                                                <button
                                                    className="btn-delete-member"
                                                    onClick={handleDeleteMember}
                                                >
                                                    <i className="fas fa-trash-alt"></i> Delete Member
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="select-member-message">
                                    <i className="fas fa-users"></i>
                                    <p>Please select a team member to manage by clicking on their profile card.</p>
                                    <p>You can change roles or remove team members from the system.</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn-close-modal" onClick={closeManageMember}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyTeam;