import { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Sidebar.css';

function Sidebar() {
    const { user, logoutUser } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogout, setShowLogout] = useState(false);

    // Determine active route
    const isActive = (path) => {
        return location.pathname === path;
    };

    const getInitial = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    const toggleLogout = () => {
        setShowLogout(!showLogout);
    };

    return (
        <div className="dashboard-sidebar">
            <div className="logo">
                <h2>Meet-Up</h2>
            </div>
            <ul className="sidebar-nav">
                <li className={isActive('/dashboard') ? 'active' : ''}>
                    <Link to="/dashboard">
                        <i className="fas fa-tachometer-alt"></i>
                        <span>Dashboard</span>
                    </Link>
                </li>
                <li className={isActive('/my-team') ? 'active' : ''}>
                    <Link to="/my-team">
                        <i className="fas fa-users"></i>
                        <span>My Team</span>
                    </Link>
                </li>
                <li className={isActive('/meetings') ? 'active' : ''}>
                    <Link to="/meetings">
                        <i className="fas fa-video"></i>
                        <span>Meetings</span>
                    </Link>
                </li>
                <li className={isActive('/settings') ? 'active' : ''}>
                    <Link to="/settings">
                        <i className="fas fa-cog"></i>
                        <span>Settings</span>
                    </Link>
                </li>
            </ul>
            <div className="sidebar-profile-container">
                <div className="sidebar-profile" onClick={toggleLogout}>
                    <div className="profile-info">
                        {user?.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt="Profile"
                                className="profile-avatar"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = "none";
                                    e.target.parentNode.innerHTML = `<div class="text-avatar">${getInitial(user.nama)}</div>`;
                                }}
                            />
                        ) : (
                            <div className="text-avatar">
                                {getInitial(user?.nama)}
                            </div>
                        )}
                        <div className="profile-name">{user?.nama || 'User'}</div>
                        <div className="profile-role">{user?.role || 'Team Member'}</div>
                    </div>
                </div>

                {showLogout && (
                    <div className="logout-popup">
                        <button onClick={handleLogout} className="logout-button">
                            <i className="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Sidebar;